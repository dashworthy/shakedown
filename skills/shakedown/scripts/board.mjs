#!/usr/bin/env node
// Builds a shakedown's tldraw board from its manifest: one frame per page, one captioned
// screenshot per behavior tested. Writes the shots, board.jpg, the .tldraw file and
// manifest.json (with each shot's file name) to <out-dir>.
// Usage: node board.mjs <manifest.json> <out-dir>
// Needs tldraw Desktop running. Shrinks shots with sips (macOS) when it is installed.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir, platform } from 'node:os'
import { extname, join } from 'node:path'

const [manifestPath, outDir] = process.argv.slice(2)
if (!manifestPath || !outDir) {
	console.error('Usage: node board.mjs <manifest.json> <out-dir>')
	process.exit(1)
}

const CELL_W = 640
const COLS = 4
const CAPTION_H = 140
const GAP = 40
const PAD = 40
const COLORS = { pass: 'green', finding: 'red', 'already-broken': 'orange', 'not-tested': 'grey' }

// tldraw Desktop writes its port and token here. TLDRAW_SERVER_JSON overrides the path.
const serverJson =
	process.env.TLDRAW_SERVER_JSON ??
	{
		darwin: join(homedir(), 'Library/Application Support/tldraw/server.json'),
		win32: join(process.env.APPDATA ?? join(homedir(), 'AppData/Roaming'), 'tldraw/server.json'),
	}[platform()] ??
	join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'tldraw/server.json')
const server = JSON.parse(readFileSync(serverJson, 'utf8'))

async function post(path, body) {
	const res = await fetch(`http://localhost:${server.port}${path}`, {
		method: 'POST',
		headers: { authorization: `Bearer ${server.token}`, 'content-type': 'application/json' },
		body: JSON.stringify(body),
	})
	const json = await res.json()
	if (!json.success) throw new Error(`${path}: ${JSON.stringify(json)}`)
	return json.result
}

const exec = (docId, code) => post(`/api/doc/${docId}/exec`, { code })

function slug(text) {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
}

// Reads a PNG's or JPEG's pixel size from its header.
function imageSize(bytes) {
	if (bytes.readUInt32BE(0) === 0x89504e47) return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) }
	for (let i = 2; i < bytes.length; ) {
		const marker = bytes[i + 1]
		if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
			return { w: bytes.readUInt16BE(i + 7), h: bytes.readUInt16BE(i + 5) }
		}
		i += 2 + bytes.readUInt16BE(i + 2)
	}
	throw new Error('Not a PNG or JPEG')
}

// Copies a screenshot to <outDir>/<name>, as a JPEG at most CELL_W * 2 wide when sips is
// installed, and returns the file name, size and type.
function prepare(src, name) {
	let file = `${name}.jpg`
	try {
		execFileSync('sips', ['-s', 'format', 'jpeg', '-Z', String(CELL_W * 2), src, '--out', join(outDir, file)], { stdio: 'ignore' })
	} catch {
		file = `${name}${extname(src).toLowerCase()}`
		copyFileSync(src, join(outDir, file))
	}
	const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg'
	return { file, mime, ...imageSize(readFileSync(join(outDir, file))) }
}

function caption(shot) {
	const status = shot.status === 'finding' ? `FINDING #${shot.finding}` : shot.status.toUpperCase()
	return `${status}: ${shot.behavior}${shot.why ? `\nWhy: ${shot.why}` : ''}`
}

mkdirSync(outDir, { recursive: true })
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

const doc = await post('/api/docs/create', { name: manifest.title, directory: outDir })

await exec(doc.id, `
	const { createShapeId, toRichText } = await import('tldraw')
	editor.createShape({ id: createShapeId('title'), type: 'text', x: 0, y: 0, props: { richText: toRichText(${JSON.stringify(manifest.title)}), size: 'xl' } })
`)

let y = 120
for (const [p, page] of manifest.pages.entries()) {
	const cells = page.shots.map((shot, s) => {
		if (!shot.image) return { shot, imageH: 0 }
		const size = prepare(shot.image, `${p + 1}-${s + 1}-${slug(shot.behavior)}`)
		shot.file = size.file
		return { shot, imageH: Math.round((size.h * CELL_W) / size.w), size }
	})
	// Shots wrap after COLS per row, each row as tall as its tallest shot.
	const rowTops = [PAD]
	for (let r = 0; r * COLS < cells.length; r++) {
		const rowCells = cells.slice(r * COLS, (r + 1) * COLS)
		rowTops.push(rowTops[r] + CAPTION_H + Math.max(0, ...rowCells.map((c) => c.imageH)) + GAP)
	}
	const cols = Math.min(cells.length, COLS)
	const frame = { w: PAD * 2 + cols * CELL_W + (cols - 1) * GAP, h: rowTops.at(-1) - GAP + PAD }
	const frameKey = `page-${p}`

	await exec(doc.id, `
		const { createShapeId } = await import('tldraw')
		editor.createShape({ id: createShapeId('${frameKey}'), type: 'frame', x: 0, y: ${y}, props: { w: ${frame.w}, h: ${frame.h}, name: ${JSON.stringify(`${page.name}  ${page.url}`)} } })
	`)

	for (const [s, { shot, imageH, size }] of cells.entries()) {
		const x = PAD + (s % COLS) * (CELL_W + GAP)
		const top = rowTops[Math.floor(s / COLS)]
		const image = size
			? `
				const assetId = AssetRecordType.createId()
				editor.createAssets([{ id: assetId, typeName: 'asset', type: 'image', meta: {}, props: { name: '${shot.file}', src: 'data:${size.mime};base64,${readFileSync(join(outDir, shot.file)).toString('base64')}', w: ${size.w}, h: ${size.h}, mimeType: '${size.mime}', isAnimated: false } }])
				editor.createShape({ id: createShapeId('${frameKey}-shot-${s}'), type: 'image', parentId: frame, x: ${x}, y: ${top + CAPTION_H}, props: { assetId, w: ${CELL_W}, h: ${imageH} } })
			`
			: ''
		await exec(doc.id, `
			const { AssetRecordType, createShapeId, toRichText } = await import('tldraw')
			const frame = createShapeId('${frameKey}')
			editor.createShape({ id: createShapeId('${frameKey}-caption-${s}'), type: 'geo', parentId: frame, x: ${x}, y: ${top}, props: { geo: 'rectangle', w: ${CELL_W}, h: ${CAPTION_H - 10}, color: '${COLORS[shot.status]}', fill: 'semi', size: 's', align: 'start', verticalAlign: 'middle', richText: toRichText(${JSON.stringify(caption(shot))}) } })
			${image}
		`)
	}
	y += frame.h + GAP * 2
}

await exec(doc.id, 'await helpers.saveDoc()')
const shot = await post('/api/search', { code: `return await api.getScreenshot(${JSON.stringify(doc.id)}, { size: 'full' })` })
copyFileSync(shot.filePath, join(outDir, 'board.jpg'))
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, '\t'))

console.log(JSON.stringify({ docId: doc.id, tldraw: doc.filePath, board: join(outDir, 'board.jpg'), manifest: join(outDir, 'manifest.json') }))
