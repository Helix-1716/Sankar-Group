import Avatar from './Avatar';

export default function TaskCard({ task, members = [], onEdit, onStatusChange, isDragging }) {
  const priorityColors = {
    high: 'badge-priority-high',
    medium: 'badge-priority-medium',
    low: 'badge-priority-low',
  };

  const assignee = members.find(m => m.uid === task.assigneeId);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: `${Math.abs(days)}d overdue`, overdue: true };
    if (days === 0) return { text: 'Due today', overdue: false };
    if (days <= 3) return { text: `${days}d left`, overdue: false };
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false };
  };

  const dueInfo = formatDate(task.dueDate);

  return (
    <div
      className={`task-card ${isDragging ? 'task-card-dragging' : ''}`}
      onClick={() => onEdit && onEdit(task)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.setData('fromStatus', task.status);
        e.target.classList.add('task-card-dragging');
      }}
      onDragEnd={(e) => {
        e.target.classList.remove('task-card-dragging');
      }}
    >
      <div className="task-card-header">
        <span className={`badge ${priorityColors[task.priority] || 'badge-priority-medium'}`}>
          {task.priority}
        </span>
      </div>

      <h4 className="task-card-title">{task.title}</h4>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      <div className="task-card-footer">
        {assignee ? (
          <Avatar name={assignee.name} color={assignee.avatarColor} size={24} />
        ) : (
          <span className="task-card-unassigned">Unassigned</span>
        )}

        {dueInfo && (
          <span className={`task-card-due ${dueInfo.overdue ? 'task-card-overdue' : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            {dueInfo.text}
          </span>
        )}
      </div>
    </div>
  );
}
