import { Command } from 'cmdk';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CreditCard, Users, Home } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      // Cmd+K or Ctrl+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ['globalSearchStudents'],
    queryFn: async () => {
      const res = await api.get('/students/?no_paginate=true');
      return res.data;
    },
    enabled: open // Only fetch when open
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      
      <div className="relative z-50 w-full max-w-2xl transform transition-all mx-4">
        <Command 
          className="w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 cmdk-command"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        >
          <div className="flex items-center px-4 border-b border-gray-100">
            <Search className="w-5 h-5 text-blue-600" />
            <Command.Input 
              autoFocus
              className="w-full px-4 py-5 text-gray-800 bg-transparent outline-none placeholder:text-gray-400 font-medium"
              placeholder="Search students, pages, or actions..." 
            />
            <div className="px-2 py-1 bg-gray-100 rounded border border-gray-200 text-[10px] font-bold text-gray-500 tracking-widest leading-none">ESC</div>
          </div>

          <Command.List className="max-h-[50vh] overflow-y-auto p-2 cmdk-list">
            <Command.Empty className="py-12 text-center">
               <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Search className="w-8 h-8 text-gray-400" />
               </div>
               <p className="text-gray-800 font-bold">No results found.</p>
               <p className="text-sm text-gray-500 mt-1">Try another search term.</p>
            </Command.Empty>

            <Command.Group className="px-2 py-3 mb-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-2">Quick Links</div>
              
              <Command.Item 
                onSelect={() => { navigate('/'); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 outline-none"
              >
                <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600"><Home size={16} /></div>
                <span className="font-bold">Dashboard Overview</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => { navigate('/students'); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 outline-none"
              >
                <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600"><Users size={16} /></div>
                <span className="font-bold">Student Directory</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => { navigate('/payments'); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 outline-none"
              >
                <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600"><CreditCard size={16} /></div>
                <span className="font-bold">Payment Tracker</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-gray-100 mx-4" />

            <Command.Group className="px-2 py-3 mt-2">
               <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-2">Students Directory</div>
               {students.map(student => (
                  <Command.Item 
                    key={student.id}
                    onSelect={() => { 
                      navigate('/students');
                      setOpen(false); 
                    }}
                    value={`${student.first_name} ${student.last_name} ${student.student_id}`}
                    className="flex items-center justify-between px-3 py-3 text-sm text-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group data-[selected=true]:bg-gray-50 outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-blue-700 group-hover:bg-blue-200 transition-colors border border-blue-200 uppercase">
                        {student?.first_name?.charAt(0) || ''}{student?.last_name?.charAt(0) || ''}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{student?.first_name || 'Unknown'} {student?.last_name || ''}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{student?.student_id || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-[10px] font-bold text-gray-600">
                      {student.class_level_name}
                    </div>
                  </Command.Item>
               ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
};

export default GlobalSearch;
