import { useState, useEffect } from 'react';
import type { MenuProps } from 'antd';
import { 
  Typography, 
  Input, 
  Button, 
  Space, 
  message,
  Avatar,
  Breadcrumb
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  DownOutlined,
  StarFilled,
  QuestionCircleOutlined,
  BellOutlined,
  SettingOutlined,
  SearchOutlined,
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined
} from '@ant-design/icons';
import type { DropResult } from '@hello-pangea/dnd';
import { 
  DragDropContext, 
  Droppable, 
  Draggable 
} from '@hello-pangea/dnd';
import './App.css';

const { Title, Text } = Typography;

type Priority = 'High' | 'Medium' | 'Low';

interface Task {
  id: string;
  content: string;
  key: string; // e.g., TODO-123
  priority: Priority;
  assignee: string;
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

interface KanbanData {
  tasks: { [key: string]: Task };
  columns: { [key: string]: Column };
  columnOrder: string[];
  nextId: number;
}

const initialData: KanbanData = {
  tasks: {
    'task-1': { id: 'task-1', key: 'WEB-1', content: 'Thiết kế giao diện Kanban', priority: 'High', assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    'task-2': { id: 'task-2', key: 'WEB-2', content: 'Cài đặt thư viện antd', priority: 'Medium', assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  },
  columns: {
    'todo': { id: 'todo', title: 'To Do', taskIds: ['task-1', 'task-2'] },
    'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
    'done': { id: 'done', title: 'Done', taskIds: [] }
  },
  columnOrder: ['todo', 'in-progress', 'done'],
  nextId: 3
};

const PriorityIcon = ({ priority }: { priority: Priority }) => {
  switch (priority) {
    case 'High': return <ArrowUpOutlined style={{ color: '#ff4d4f' }} />;
    case 'Medium': return <MinusOutlined style={{ color: '#faad14' }} />;
    case 'Low': return <ArrowDownOutlined style={{ color: '#52c41a' }} />;
  }
};

function App() {
  const [data, setData] = useState<KanbanData>(() => {
    const saved = localStorage.getItem('jira-todo-v2');
    return saved ? JSON.parse(saved) : initialData;
  });
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');

  useEffect(() => {
    localStorage.setItem('jira-todo-v2', JSON.stringify(data));
  }, [data]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      setData({ ...data, columns: { ...data.columns, [start.id]: { ...start, taskIds: newTaskIds } } });
      return;
    }

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);

    setData({
      ...data,
      columns: {
        ...data.columns,
        [start.id]: { ...start, taskIds: startTaskIds },
        [finish.id]: { ...finish, taskIds: finishTaskIds }
      }
    });
  };

  const handleQuickAdd = (columnId: string) => {
    if (!quickAddValue.trim()) {
      setAddingToColumn(null);
      return;
    }

    const newId = `task-${data.nextId}`;
    const newKey = `WEB-${data.nextId}`;
    const newTask: Task = {
      id: newId,
      key: newKey,
      content: quickAddValue,
      priority: 'Medium',
      assignee: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newId}`
    };

    const column = data.columns[columnId];
    const newTaskIds = [...column.taskIds, newId];

    setData({
      ...data,
      nextId: data.nextId + 1,
      tasks: { ...data.tasks, [newId]: newTask },
      columns: { ...data.columns, [columnId]: { ...column, taskIds: newTaskIds } }
    });

    setQuickAddValue('');
    setAddingToColumn(null);
    message.success(`Created item ${newKey}`);
  };

  const deleteTask = (taskId: string, columnId: string) => {
    const column = data.columns[columnId];
    const newTaskIds = column.taskIds.filter(id => id !== taskId);
    const newTasks = { ...data.tasks };
    const taskKey = newTasks[taskId].key;
    delete newTasks[taskId];

    setData({
      ...data,
      tasks: newTasks,
      columns: { ...data.columns, [columnId]: { ...column, taskIds: newTaskIds } }
    });
    message.info(`Deleted ${taskKey}`);
  };

  const navbarMenu: MenuProps['items'] = [
    { key: '1', label: 'Your work' },
    { key: '2', label: 'Projects' },
    { key: '3', label: 'Filters' },
    { key: '4', label: 'Dashboards' },
    { key: '5', label: 'Teams' },
    { key: '6', label: 'Apps' },
  ];

  return (
    <div className="jira-layout">
      <nav className="jira-navbar">
        <Space size={24}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 24, height: 24, background: '#0052cc', borderRadius: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, border: '2px solid white', rotate: '45deg' }} />
            </div>
            <Text strong style={{ fontSize: 18, color: '#172b4d' }}>Jira Software</Text>
          </div>
          <Space size={16}>
            {navbarMenu.map(item => (
              <Button type="text" key={item?.key} style={{ color: '#42526e', fontWeight: 500 }}>
                {String((item as any).label)} <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
              </Button>
            ))}
            <Button type="primary" style={{ borderRadius: 3, fontWeight: 500 }}>Create</Button>
          </Space>
        </Space>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Input 
            prefix={<SearchOutlined style={{ color: '#6b778c' }} />} 
            placeholder="Search" 
            style={{ width: 200, borderRadius: 3 }}
          />
          <BellOutlined style={{ fontSize: 18, color: '#6b778c', cursor: 'pointer' }} />
          <QuestionCircleOutlined style={{ fontSize: 18, color: '#6b778c', cursor: 'pointer' }} />
          <SettingOutlined style={{ fontSize: 18, color: '#6b778c', cursor: 'pointer' }} />
          <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" size={24} />
        </div>
      </nav>

      <main className="jira-content">
        <div className="jira-header">
          <Breadcrumb 
            items={[
              { title: 'Projects' },
              { title: 'WEB Development' },
              { title: 'WEB Board' }
            ]} 
            className="jira-breadcrumb"
          />
          <div className="jira-title-row">
            <Title level={2} style={{ margin: 0, fontWeight: 600 }}>WEB Board</Title>
            <Space>
              <Button icon={<StarFilled style={{ color: '#ffab00' }} />} type="text" />
              <Button icon={<MoreOutlined />} type="text" />
            </Space>
          </div>

          <div className="jira-filters">
            <Input 
              placeholder="Search this board" 
              style={{ width: 160 }} 
              prefix={<SearchOutlined />}
              size="small"
            />
            <Avatar.Group maxCount={4} size="small">
              {Object.values(data.tasks).map(t => <Avatar key={t.id} src={t.assignee} />)}
            </Avatar.Group>
            <Button size="small" style={{ borderRadius: 3 }}>Only my issues</Button>
            <Button size="small" style={{ borderRadius: 3 }}>Recently updated</Button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

              return (
                <div className="jira-column" key={column.id}>
                  <div className="column-header">
                    <Text className="column-title">{column.title} {tasks.length}</Text>
                    <Button icon={<MoreOutlined />} type="text" size="small" />
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                className={`jira-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <div className="card-content">{task.content}</div>
                                <div className="card-footer">
                                  <Space size={8}>
                                    <PriorityIcon priority={task.priority} />
                                    <span className="card-id">{task.key}</span>
                                  </Space>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="card-actions">
                                      <Button 
                                        type="text" 
                                        danger 
                                        size="small"
                                        icon={<DeleteOutlined style={{ fontSize: 12 }} />} 
                                        onClick={() => deleteTask(task.id, column.id)}
                                      />
                                    </div>
                                    <Avatar src={task.assignee} size={20} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        <div className="quick-add-container">
                          {addingToColumn === column.id ? (
                            <Input.TextArea 
                              autoSize={{ minRows: 2, maxRows: 4 }}
                              placeholder="What needs to be done?"
                              autoFocus
                              value={quickAddValue}
                              onChange={e => setQuickAddValue(e.target.value)}
                              onBlur={() => handleQuickAdd(column.id)}
                              onPressEnter={e => {
                                if (!e.shiftKey) {
                                  e.preventDefault();
                                  handleQuickAdd(column.id);
                                }
                              }}
                              style={{ borderRadius: 3, marginBottom: 8 }}
                            />
                          ) : (
                            <Button 
                              type="text" 
                              icon={<PlusOutlined />} 
                              className="quick-add-btn"
                              onClick={() => setAddingToColumn(column.id)}
                            >
                              Create issue
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
}

export default App;
