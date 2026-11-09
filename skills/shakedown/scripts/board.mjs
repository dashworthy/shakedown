#!/usr/bin/env node
// Draws a shakedown's tldraw pages from its shakedown.json: 1 Features, 2 Success,
// 3 Unexpected use, 4 Scenarios and 5 Walkthroughs (a screenshot of every step of every scenario). The first run creates the doc and records it in the JSON.
// Every shape it draws has a stable id, so a redraw updates its shapes in place: the notes,
// arrows and comments the user adds stay attached, and a card whose text the user edited stops
// the draw rather than being overwritten. `notes` prints what the user added, without drawing.
// Writes each drawn page as out/<page>.jpg beside the JSON, with the scenario screenshots and a
// copy of the .tldraw file.
// Usage: node board.mjs <shakedown.json> <features|success|unexpected|scenarios|walkthroughs>... [--dir <folder>] [--overwrite-edits]
//        node board.mjs <shakedown.json> notes
// --dir sets the folder a new doc is created in (default: tldraw's, the user's Documents).
// Needs tldraw Desktop running. Shrinks shots with sips (macOS) when it is installed.
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir, platform } from 'node:os'
import { basename, dirname, extname, join, resolve } from 'node:path'

const PAGES = { features: '1 Features', success: '2 Success', unexpected: '3 Unexpected use', scenarios: '4 Scenarios', walkthroughs: '5 Walkthroughs' }

const args = process.argv.slice(2)
const flag = (name) => args.includes(name) && Boolean(args.splice(args.indexOf(name), 1))
const option = (name) => (args.includes(name) ? args.splice(args.indexOf(name), 2)[1] : undefined)
const overwriteEdits = flag('--overwrite-edits')
const dirArg = option('--dir')
const newDocDir = dirArg && resolve(dirArg)
const [jsonPath, ...pageKeys] = args
const notesOnly = pageKeys.length === 1 && pageKeys[0] === 'notes'
if (!jsonPath || !pageKeys.length || (!notesOnly && pageKeys.some((k) => !PAGES[k]))) {
	console.error(`Usage: node board.mjs <shakedown.json> <${Object.keys(PAGES).join('|')}>... [--dir <folder>] [--overwrite-edits]`)
	console.error('       node board.mjs <shakedown.json> notes')
	process.exit(1)
}

const CELL_W = 560
const COLS = 4
const GAP = 40
const PAD = 40
const KIND_COLORS = { new: 'blue', changed: 'violet', reached: 'grey', existing: 'black' }
const STATUS_COLORS = { planned: 'black', pass: 'green', fail: 'red', 'not-tested': 'grey' }

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
const search = (code) => post('/api/search', { code })
const q = JSON.stringify

// A page's shapes are all `shape:shakedown-<page>-<part>`, where part is a feature or scenario
// id (or `<scenario id>-<step>` on Walkthroughs), `frame-<section>`, `shot-<card>`, `title` or `summary`. Anything else is the user's.
const pageId = (key) => `page:shakedown-${key}`
const shapePrefix = (key) => `shape:shakedown-${key}-`

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
// installed, and returns the file name, type, size and a hash of its bytes. A copy at least as
// new as the screenshot is reused.
function prepare(src, name) {
	let file = `${name}.jpg`
	const fresh = (f) => existsSync(join(outDir, f)) && statSync(join(outDir, f)).mtimeMs >= statSync(src).mtimeMs
	if (!fresh(file)) {
		try {
			execFileSync('sips', ['-s', 'format', 'jpeg', '-Z', String(CELL_W * 2), src, '--out', join(outDir, file)], { stdio: 'ignore' })
		} catch {
			file = `${name}${extname(src).toLowerCase()}`
			copyFileSync(src, join(outDir, file))
		}
	}
	const bytes = readFileSync(join(outDir, file))
	const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg'
	return { file, mime, hash: createHash('sha1').update(bytes).digest('hex'), ...imageSize(bytes) }
}

const lines = (...parts) => parts.filter((p) => typeof p === 'string').join('\n')
const label = (s) => [s.id, s.op?.toUpperCase(), s.category?.toUpperCase()].filter(Boolean).join(' · ')
const steps = (s) => s.steps?.length && `Steps: ${s.steps.map((step, i) => `${i + 1}. ${step}`).join(' ')}`
const files = (paths = []) => paths.slice(0, 4).map((p) => basename(p)).join(', ') + (paths.length > 4 ? ` +${paths.length - 4} more` : '')

function featureCard(f) {
	const count = (type) => f.scenarios?.filter((s) => s.type === type).length ?? 0
	return {
		key: f.id,
		color: KIND_COLORS[f.kind] ?? 'black',
		text: lines(
			[f.id, f.kind?.toUpperCase()].filter(Boolean).join(' · '),
			f.name,
			'',
			f.pages?.length && `Pages: ${f.pages.map((p) => `${p.name} (${p.url})`).join(', ')}`,
			f.via?.length && `Via: ${files(f.via)}`,
			f.tables?.length && `Tables: ${f.tables.join(', ')}`,
			f.expected_from?.length && `Expected from: ${f.expected_from.join(', ')}`,
			`File: ${f.file ? basename(f.file) : 'none yet'}`,
			f.scenarios?.length && `Scenarios: ${count('success')} success · ${count('unexpected')} unexpected`,
			f.retire?.length && `Retire: ${f.retire.map((r) => `${r.id} (${r.why})`).join('; ')}`,
		),
	}
}

function planCard(s) {
	return {
		key: s.id,
		color: s.type === 'success' ? 'light-green' : s.expected == null ? 'yellow' : 'orange',
		text: lines(
			[label(s), { file: 'FROM FILE', changed: 'CHANGED', new: 'NEW' }[s.origin]].filter(Boolean).join(' · '),
			s.title,
			'',
			s.change && `Changed: ${s.change}`,
			s.setup && `Setup: ${s.setup}`,
			steps(s),
			s.expected == null ? `QUESTION: ${s.question}` : `${s.type === 'success' ? 'Proves it' : 'Should'}: ${s.expected}`,
			s.decision && `Decision: ${s.decision}`,
			s.db && `DB: ${s.db.expect}`,
			s.risk && `Risk: ${s.risk}`,
		),
	}
}

function resultCard(s) {
	// Scenarios have no status until Phase 4 sets one.
	const st = s.status ?? 'planned'
	const status = [st.toUpperCase(), s.verdict?.toUpperCase(), s.severity?.toUpperCase()].filter(Boolean).join(' · ')
	return {
		key: s.id,
		color: s.verdict === 'already-broken' ? 'orange' : (STATUS_COLORS[st] ?? 'black'),
		image: s.image,
		shot: `${s.id}-${slug(s.title)}`,
		text: lines(
			`${status} · ${label(s)}`,
			s.title,
			'',
			s.expected != null && `Expected: ${s.expected}`,
			st === 'fail' && s.actual && `Actual: ${s.actual}`,
			st === 'fail' && s.db?.actual && `DB: ${s.db.actual}`,
			s.why && `Why: ${s.why}`,
		),
	}
}

// One card per step, with its screenshot once testing has taken one. Base's steps follow head's.
function stepCards(s) {
	const card = (shots, prefix, label) => (step, i) => {
		const shot = shots?.find((x) => x.step === i + 1)
		return {
			key: `${s.id}-${prefix}${i + 1}`,
			color: shot?.note ? 'red' : shot ? 'black' : 'grey',
			image: shot?.image,
			shot: `${s.id}-${prefix ? 'base-' : ''}step-${i + 1}`,
			text: lines(`${label}${i + 1}. ${step}`, shot?.note && `Blocked: ${shot.note}`),
		}
	}
	return [...s.steps.map(card(s.shots, '', '')), ...(s.base_shots?.length ? s.steps.map(card(s.base_shots, 'b', 'Base · ')) : [])]
}

function sections(key) {
	const byFeature = (cardOf, keep = () => true) =>
		data.features
			.map((f) => ({ key: f.id, name: `${f.id}  ${f.name}`, cards: (f.scenarios ?? []).filter(keep).map(cardOf) }))
			.filter((section) => section.cards.length)
	if (key === 'features') {
		const outOfScope = (data.out_of_scope ?? []).map((o, i) => ({ key: `out-${i + 1}`, color: 'grey', text: lines(o.what, '', `Why: ${o.why}`) }))
		return [
			{ key: 'features', name: 'Features', cards: data.features.map(featureCard) },
			...(outOfScope.length ? [{ key: 'out-of-scope', name: 'Out of scope', cards: outOfScope }] : []),
		]
	}
	if (key === 'success') return byFeature(planCard, (s) => s.type === 'success')
	if (key === 'unexpected') return byFeature(planCard, (s) => s.type === 'unexpected')
	if (key === 'walkthroughs') {
		return data.features.flatMap((f) =>
			(f.scenarios ?? [])
				.filter((s) => s.steps?.length)
				.map((s) => ({ key: s.id, name: `${s.id}  ${s.title} · ${(s.status ?? 'planned').toUpperCase()}`, cards: stepCards(s) })),
		)
	}
	return byFeature(resultCard)
}

function summary(key) {
	const all = data.features.flatMap((f) => f.scenarios ?? [])
	const n = (keep) => all.filter(keep).length
	if (key === 'features') return `${data.features.length} features, ${data.out_of_scope?.length ?? 0} out of scope. Blue new · violet changed · grey reached · black existing.`
	if (key === 'success') return `${n((s) => s.type === 'success')} ways to prove the features work.`
	if (key === 'unexpected') return `${n((s) => s.type === 'unexpected')} ways a user could make them misbehave. Yellow: what should happen is an open question.`
	if (key === 'walkthroughs') {
		const steps = all.flatMap((s) => s.steps ?? []).length
		return `${steps} steps across ${n((s) => s.steps?.length)} scenarios, ${all.flatMap((s) => s.shots ?? []).length} with a screenshot. Red: the step couldn't be done. Grey: not done yet.`
	}
	const status = (s) => s.status ?? 'planned'
	return `${all.length} scenarios: ${n((s) => status(s) === 'pass')} pass, ${n((s) => status(s) === 'fail')} fail, ${n((s) => status(s) === 'not-tested')} not tested, ${n((s) => status(s) === 'planned')} planned.`
}

// Writes `board` into shakedown.json, read again first so nothing saved since this run started
// is lost, in the file's own indentation.
function saveBoard(board) {
	data.board = board
	const raw = readFileSync(jsonPath, 'utf8')
	const fresh = JSON.parse(raw)
	fresh.board = board
	writeFileSync(jsonPath, JSON.stringify(fresh, null, /^\{\s*\n\t/.test(raw) ? '\t' : 2) + '\n')
}

async function openDoc() {
	if (data.board?.documentId) {
		const docs = await search('return await api.getDocs()')
		const doc = docs.find((d) => d.documentId === data.board.documentId)
		if (!doc) throw new Error(`Open ${data.board.file} (or wherever it was moved) in tldraw Desktop, then run this again.`)
		// The user may have renamed or moved it.
		if (doc.filePath && doc.filePath !== data.board.file) saveBoard({ ...data.board, file: doc.filePath })
		return { id: doc.id, file: data.board.file, created: false }
	}
	if (notesOnly) throw new Error('There is no board yet: draw a page first.')
	const d = new Date()
	const pad = (n) => String(n).padStart(2, '0')
	const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}.${pad(d.getMinutes())}`
	// Characters a file name or the report's link to the file can't carry become dashes.
	const name = `${data.title}, ${stamp}`.replace(/[/\\:#?%*"<>|]/g, '-')
	const doc = await post('/api/docs/create', { name, directory: newDocDir })
	saveBoard({ documentId: doc.documentId, file: doc.filePath })
	return { id: doc.id, file: doc.filePath, created: true }
}

// Everything the user added to the shakedown pages: notes and drawings with the card under them,
// arrows with what they connect, cards whose text they edited, and comment threads.
async function readNotes(docId) {
	const found = await exec(docId, `
		const out = { notes: [], arrows: [], edited: [] }
		const textOf = (s) => {
			const rt = s.props.richText
			return rt ? helpers.richTextToPlainText(rt) : (s.props.text ?? s.props.name ?? '')
		}
		for (const page of editor.getPages().filter((p) => p.id.startsWith('page:shakedown-'))) {
			const key = page.id.slice('page:shakedown-'.length)
			const prefix = 'shape:shakedown-' + key + '-'
			const shapes = [...editor.getPageShapeIds(page.id)].map((id) => editor.getShape(id))
			const cards = shapes.filter((s) => s.id.startsWith(prefix) && s.type === 'geo')
			const cardAt = (point) => cards.find((c) => editor.getShapePageBounds(c.id).containsPoint(point))?.meta.shakedown ?? null
			const name = (id) => (id.startsWith(prefix) ? editor.getShape(id).meta.shakedown : textOf(editor.getShape(id)) || editor.getShape(id).type)
			for (const s of shapes) {
				if (s.id.startsWith(prefix)) {
					const now = s.type === 'geo' && typeof s.meta.text === 'string' && textOf(s)
					if (now !== false && now !== s.meta.text) out.edited.push({ key, page: page.name, card: s.meta.shakedown, text: now })
				} else if (s.type === 'arrow') {
					const ends = Object.fromEntries(editor.getBindingsFromShape(s.id, 'arrow').map((b) => [b.props.terminal, name(b.toId)]))
					out.arrows.push({ page: page.name, from: ends.start ?? null, to: ends.end ?? null, text: textOf(s) })
				} else {
					const bounds = editor.getShapePageBounds(s.id)
					out.notes.push({ page: page.name, type: s.type, text: textOf(s), on: bounds ? cardAt(bounds.center) : null })
				}
			}
		}
		return out
	`)
	// Older tldraw Desktop versions have no comments.
	const { threads = [] } = await search(`return await api.getComments?.(${q(docId)}) ?? {}`)
	found.comments = threads.map((t) => {
		const shape = JSON.stringify(t.anchor ?? null).match(/"shape:shakedown-(features|success|unexpected|scenarios|walkthroughs)-([^"]+)"/)
		return {
			page: shape ? PAGES[shape[1]] : null,
			on: shape ? shape[2] : null,
			anchor: shape ? undefined : t.anchor,
			resolved: t.resolved,
			comments: (t.comments ?? []).map((c) => c.text),
		}
	})
	return found
}

async function drawPage(docId, key, newDoc) {
	const secs = sections(key)
	// Screenshots are prepared first, so their heights are known when the page is laid out.
	for (const card of secs.flatMap((s) => s.cards)) if (card.image) card.img = prepare(card.image, card.shot)
	const spec = {
		pageId: pageId(key),
		pageName: PAGES[key],
		prefix: shapePrefix(key),
		title: `${data.title} · ${PAGES[key]}`,
		summary: summary(key),
		sections: secs.map((s) => ({ ...s, cards: s.cards.map((c) => ({ key: c.key, color: c.color, text: c.text, img: c.img && { w: c.img.w, h: c.img.h } })) })),
		newDoc,
		CELL_W,
		COLS,
		GAP,
		PAD,
	}
	const { images } = await exec(docId, `
		const { toRichText } = await import('tldraw')
		const spec = ${q(spec)}
		const ours = (id) => id.startsWith(spec.prefix)
		if (!editor.getPage(spec.pageId)) editor.createPage({ id: spec.pageId, name: spec.pageName })
		const before = [...editor.getPageShapeIds(spec.pageId)].filter(ours)
		const drawn = new Set()
		const images = []
		// Shapes are given their page or frame as parent, so whichever page the user is looking at
		// doesn't matter, and locked ones are updated too.
		editor.run(() => {
			const put = (part, shape) => {
				const id = spec.prefix + part
				drawn.add(id)
				const old = editor.getShape(id)
				if (old && old.type !== shape.type) editor.deleteShapes([id])
				const next = { ...shape, id, meta: { ...shape.meta, shakedown: part } }
				if (old?.type === shape.type) editor.updateShape(next)
				else editor.createShape(next)
				return id
			}
			put('title', { type: 'text', parentId: spec.pageId, x: 0, y: 0, props: { richText: toRichText(spec.title), size: 'xl' } })
			put('summary', { type: 'text', parentId: spec.pageId, x: 0, y: 80, props: { richText: toRichText(spec.summary), size: 's' } })
			let y = 160
			for (const section of spec.sections) {
				const frame = put('frame-' + section.key, { type: 'frame', parentId: spec.pageId, x: 0, y, props: { name: section.name } })
				// Cards wrap after COLS per row. A row's screenshots line up under its tallest card.
				const x = (c) => spec.PAD + c * (spec.CELL_W + spec.GAP)
				let top = spec.PAD
				for (let r = 0; r * spec.COLS < section.cards.length; r++) {
					const row = section.cards.slice(r * spec.COLS, (r + 1) * spec.COLS)
					const heights = row.map((card, c) => {
						const richText = toRichText(card.text)
						// meta.text is what was drawn, so an edit on the board shows as a difference.
						const id = put(card.key, { type: 'geo', parentId: frame, x: x(c), y: top, meta: { text: helpers.richTextToPlainText(richText) }, props: { geo: 'rectangle', w: spec.CELL_W, h: 60, color: card.color, fill: 'semi', size: 's', align: 'start', verticalAlign: 'start', richText } })
						return editor.getShapePageBounds(id).h
					})
					top += Math.max(...heights) + spec.GAP / 2
					let imagesH = 0
					row.forEach((card, c) => {
						if (!card.img) return
						const h = Math.round((card.img.h * spec.CELL_W) / card.img.w)
						imagesH = Math.max(imagesH, h)
						drawn.add(spec.prefix + 'shot-' + card.key)
						images.push({ part: 'shot-' + card.key, card: card.key, parentId: frame, x: x(c), y: top, w: spec.CELL_W, h })
					})
					top += imagesH ? imagesH + spec.GAP : spec.GAP / 2
				}
				const cols = Math.min(section.cards.length, spec.COLS)
				const size = { w: spec.PAD * 2 + cols * spec.CELL_W + (cols - 1) * spec.GAP, h: top - spec.GAP + spec.PAD }
				editor.updateShape({ id: frame, type: 'frame', props: size })
				y += size.h + spec.GAP * 2
			}
			// What an earlier draw made and this one didn't goes, once anything the user put inside
			// it is moved out to the page.
			const stale = before.filter((id) => !drawn.has(id) && editor.getShape(id))
			const theirs = stale.flatMap((id) => editor.getSortedChildIdsForParent(id)).filter((id) => !ours(id))
			if (theirs.length) editor.reparentShapes(theirs, spec.pageId)
			editor.deleteShapes(stale)
			// Keep the user's notes on top of the frames.
			const notes = editor.getSortedChildIdsForParent(spec.pageId).filter((id) => !ours(id))
			if (notes.length) editor.bringToFront(notes)
			// A new doc starts with an empty page of its own.
			if (spec.newDoc) {
				for (const page of editor.getPages()) {
					if (!page.id.startsWith('page:shakedown-') && editor.getPageShapeIds(page.id).size === 0) editor.deletePage(page.id)
				}
			}
		}, { ignoreShapeLock: true })
		return { images }
	`)
	// One asset per scenario, replaced only when its screenshot changes.
	const imgs = Object.fromEntries(secs.flatMap((s) => s.cards).filter((c) => c.img).map((c) => [c.key, c.img]))
	for (const image of images) {
		const img = imgs[image.card]
		const assetId = `asset:shakedown-${image.card}`
		const same = await exec(docId, `return editor.getAsset(${q(assetId)})?.meta.hash === ${q(img.hash)}`)
		const asset = !same && {
			id: assetId,
			typeName: 'asset',
			type: 'image',
			meta: { hash: img.hash },
			props: { name: img.file, src: `data:${img.mime};base64,${readFileSync(join(outDir, img.file)).toString('base64')}`, w: img.w, h: img.h, mimeType: img.mime, isAnimated: false },
		}
		const shape = { id: spec.prefix + image.part, type: 'image', parentId: image.parentId, x: image.x, y: image.y, meta: { shakedown: image.part }, props: { assetId, w: image.w, h: image.h } }
		await exec(docId, `
			const asset = ${q(asset)}
			const shape = ${q(shape)}
			editor.run(() => {
				if (asset && editor.getAsset(asset.id)) editor.updateAssets([asset])
				else if (asset) editor.createAssets([asset])
				if (editor.getShape(shape.id)) editor.updateShape(shape)
				else editor.createShape(shape)
			}, { ignoreShapeLock: true })
		`)
	}
}

// Sets the page, then screenshots it. The user can switch pages in between, so the screenshot's
// page is checked.
async function screenshot(docId, key) {
	for (let attempt = 0; attempt < 3; attempt++) {
		const bounds = await exec(docId, `
			editor.setCurrentPage(${q(pageId(key))})
			const b = editor.getCurrentPageBounds()
			return { x: b.x - ${PAD}, y: b.y - ${PAD}, w: b.w + ${PAD * 2}, h: b.h + ${PAD * 2} }
		`)
		const shot = await search(`return await api.getScreenshot(${q(docId)}, { size: 'full', bounds: ${q(bounds)} })`)
		if (shot.pageName === PAGES[key]) return shot.filePath
	}
	throw new Error(`Couldn't screenshot ${PAGES[key]}, because the page kept changing. Run this again.`)
}

const data = JSON.parse(readFileSync(jsonPath, 'utf8'))
const outDir = join(dirname(resolve(jsonPath)), 'out')
mkdirSync(outDir, { recursive: true })

const doc = await openDoc()
const keys = Object.keys(PAGES).filter((k) => pageKeys.includes(k))
if (notesOnly) {
	console.log(JSON.stringify(await readNotes(doc.id), null, 2))
	process.exit(0)
}

const edited = doc.created ? [] : (await readNotes(doc.id)).edited.filter((e) => keys.includes(e.key))
if (edited.length && !overwriteEdits) {
	console.error('Nothing was drawn, because these cards were edited on the board:')
	for (const e of edited) console.error(`- ${e.page}, ${e.card}: ${JSON.stringify(e.text)}`)
	console.error('Apply the edits to shakedown.json, then run this again with --overwrite-edits.')
	process.exit(2)
}

const userPage = await exec(doc.id, 'return editor.getCurrentPageId()')
for (const key of keys) await drawPage(doc.id, key, doc.created)
// Screenshots no shape shows any more go, so the file doesn't grow with every redraw.
await exec(doc.id, `
	const used = new Set(editor.store.allRecords().filter((r) => r.typeName === 'shape' && r.type === 'image').map((r) => r.props.assetId))
	const unused = editor.getAssets().filter((a) => a.id.startsWith('asset:shakedown-') && !used.has(a.id))
	if (unused.length) editor.deleteAssets(unused.map((a) => a.id))
	await helpers.saveDoc()
`)

const images = {}
for (const key of keys) {
	images[key] = join(outDir, `${key}.jpg`)
	copyFileSync(await screenshot(doc.id, key), images[key])
}
// Back to the page the user was on, or for a new doc, the first page drawn.
await exec(doc.id, `
	const back = ${q(userPage)}
	editor.setCurrentPage(editor.getPage(back) ? back : ${q(pageId(keys[0]))})
`)
// macOS can deny the terminal read access to the folder tldraw saves in (Documents, Desktop).
let copied = true
try {
	copyFileSync(doc.file, join(outDir, basename(doc.file)))
} catch (e) {
	copied = false
	console.error(`Couldn't copy ${doc.file} to ${outDir} (${e.code}). Draw with --dir <a folder the terminal can read> to include the .tldraw file in the report.`)
}

console.log(JSON.stringify({ tldraw: doc.file, copied, out: outDir, images }))
