import StatusBadge from '@/Components/StatusBadge'

export default function ProjectShow({ project }) {
    return (
        <ol>
            {project.tasks.map((task) => (
                <li key={task.id}>{task.title} <StatusBadge status={task.ticket.status} /></li>
            ))}
        </ol>
    )
}
