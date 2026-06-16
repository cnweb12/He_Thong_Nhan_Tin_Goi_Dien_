import React, { useEffect, useState } from 'react';
import { 
  CheckSquare, Plus, Calendar, AlertCircle, Trash2, 
  CheckCircle2, Clock, ListTodo, FileText, ArrowRight 
} from 'lucide-react';

export default function TasksPage({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium'); // low | medium | high
  const [dueDate, setDueDate] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const currentUserId = currentUser?.userId || currentUser?.id || currentUser?._id || 'guest';
  const localStorageKey = `local_tasks_${currentUserId}`;

  // Load tasks from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(localStorageKey);
    if (raw) {
      try {
        setTasks(JSON.parse(raw));
      } catch (e) {
        console.error('Không tải được danh sách công việc:', e);
      }
    } else {
      // Seed default tasks
      const defaultTasks = [
        {
          id: '1',
          title: 'Trải nghiệm tính năng nhắn tin thời gian thực',
          description: 'Thử gửi tin nhắn và file ảnh cho bạn bè để kiểm tra kết nối Socket.io và cơ sở dữ liệu.',
          status: 'todo',
          priority: 'high',
          dueDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Thực hiện cuộc gọi thoại WebRTC',
          description: 'Bấm nút Gọi thoại ở góc trên bên phải khung chat để thực hiện cuộc gọi ngang hàng WebRTC.',
          status: 'in_progress',
          priority: 'medium',
          dueDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        }
      ];
      setTasks(defaultTasks);
      localStorage.setItem(localStorageKey, JSON.stringify(defaultTasks));
    }
  }, [localStorageKey]);

  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks);
    localStorage.setItem(localStorageKey, JSON.stringify(updatedTasks));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      status: 'todo', // todo | in_progress | done
      priority,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    
    // Reset form
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setShowAddForm(false);
  };

  const handleDeleteTask = (taskId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) return;
    const updated = tasks.filter((t) => t.id !== taskId);
    saveTasks(updated);
  };

  const handleUpdateStatus = (taskId, newStatus) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: newStatus };
      }
      return t;
    });
    saveTasks(updated);
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high':
        return 'border-l-red-500 bg-red-50/35';
      case 'medium':
        return 'border-l-amber-500 bg-amber-50/20';
      case 'low':
      default:
        return 'border-l-blue-500 bg-blue-50/20';
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'low':
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  // Filter tasks by status
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-[#0e1621]">
      {/* Header */}
      <header className="h-[68px] border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 dark:border-[#1e2d3d] dark:bg-[#17212b]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-md">
            <CheckSquare size={22} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm dark:text-slate-100">Giao việc & Công việc</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Theo dõi tiến trình công việc cá nhân của bạn</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          Thêm công việc
        </button>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Form Add Task Modal / Collapse */}
        {showAddForm && (
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-md max-w-2xl mx-auto transition-all animate-fadeIn dark:bg-[#1c2b38] dark:border-[#1e2d3d]">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 dark:text-slate-100">
              <ListTodo size={18} className="text-indigo-600" />
              Tạo công việc mới
            </h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Tiêu đề công việc *</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề..."
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:bg-[#17212b] dark:border-[#1e2d3d] dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Mô tả công việc</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả cụ thể nhiệm vụ..."
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 resize-none dark:bg-[#17212b] dark:border-[#1e2d3d] dark:text-slate-100"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Độ ưu tiên</span>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 bg-white text-sm outline-none transition focus:border-indigo-500 dark:bg-[#17212b] dark:border-[#1e2d3d] dark:text-slate-100"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Hạn chót (Due Date)</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-indigo-500 dark:bg-[#17212b] dark:border-[#1e2d3d] dark:text-slate-100"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition cursor-pointer dark:border-[#1e2d3d] dark:text-slate-300 dark:hover:bg-[#1c2b38]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
                >
                  Tạo mới
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kanban Board columns */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
          
          {/* Column 1: TODO */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col min-h-[500px] dark:bg-[#1c2b38]/50 dark:border-[#1e2d3d]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#1e2d3d]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="font-bold text-slate-700 text-sm dark:text-slate-200">Cần làm</h3>
              </div>
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold dark:bg-[#17212b] dark:text-slate-300">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {todoTasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Chưa có công việc cần làm</p>
              ) : (
                todoTasks.map((task) => (
                  <div key={task.id} className={`p-4 rounded-xl border-l-4 bg-white shadow-sm border border-slate-200/60 ${getPriorityColor(task.priority)} flex flex-col justify-between group hover:shadow-md transition duration-200 dark:bg-[#17212b] dark:border-[#1e2d3d]`}>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityBadge(task.priority)} uppercase`}>
                          {task.priority === 'high' ? 'Khẩn' : task.priority === 'medium' ? 'Thường' : 'Thấp'}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer p-0.5 rounded"
                          title="Xóa công việc"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-2 leading-tight dark:text-slate-100">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3 dark:text-slate-400">{task.description}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between dark:border-[#1e2d3d]/50">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                        <Calendar size={11} />
                        <span>{task.dueDate}</span>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                      >
                        Bắt đầu
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col min-h-[500px] dark:bg-[#1c2b38]/50 dark:border-[#1e2d3d]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#1e2d3d]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-bold text-slate-700 text-sm dark:text-slate-200">Đang thực hiện</h3>
              </div>
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold dark:bg-[#17212b] dark:text-slate-300">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {inProgressTasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Không có công việc đang làm</p>
              ) : (
                inProgressTasks.map((task) => (
                  <div key={task.id} className={`p-4 rounded-xl border-l-4 bg-white shadow-sm border border-slate-200/60 ${getPriorityColor(task.priority)} flex flex-col justify-between group hover:shadow-md transition duration-200 dark:bg-[#17212b] dark:border-[#1e2d3d]`}>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityBadge(task.priority)} uppercase`}>
                          {task.priority === 'high' ? 'Khẩn' : task.priority === 'medium' ? 'Thường' : 'Thấp'}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer p-0.5 rounded"
                          title="Xóa công việc"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-2 leading-tight dark:text-slate-100">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3 dark:text-slate-400">{task.description}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between dark:border-[#1e2d3d]/50">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                        <Clock size={11} className="text-amber-500" />
                        <span>Hạn: {task.dueDate}</span>
                      </div>
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'done')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-55 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                      >
                        Xong
                        <CheckCircle2 size={10} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: DONE */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 shadow-sm flex flex-col min-h-[500px] dark:bg-[#1c2b38]/50 dark:border-[#1e2d3d]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#1e2d3d]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-slate-700 text-sm dark:text-slate-200">Đã hoàn thành</h3>
              </div>
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold dark:bg-[#17212b] dark:text-slate-300">
                {doneTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {doneTasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Chưa hoàn thành công việc nào</p>
              ) : (
                doneTasks.map((task) => (
                  <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-white/70 shadow-sm flex flex-col justify-between group opacity-75 hover:opacity-100 hover:bg-white transition duration-200 dark:bg-[#17212b]/70 dark:border-[#1e2d3d] dark:hover:bg-[#17212b]">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase dark:bg-[#1c2b38] dark:text-slate-400">
                          Hoàn thành
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer p-0.5 rounded"
                          title="Xóa công việc"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-500 text-sm mt-2 leading-tight line-through dark:text-slate-500">{task.title}</h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between dark:border-[#1e2d3d]/50">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                        <CheckCircle2 size={9} />
                        Đã đóng
                      </span>
                      <button
                        onClick={() => handleUpdateStatus(task.id, 'todo')}
                        className="text-[9px] text-slate-400 hover:text-slate-600 font-semibold hover:underline cursor-pointer"
                      >
                        Khôi phục lại
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
