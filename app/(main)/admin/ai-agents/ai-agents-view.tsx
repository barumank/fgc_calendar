'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Bot, Play, Power, GripVertical, Settings as SettingsIcon } from 'lucide-react';
import { mockAgents } from '@/src/data/mock-agents';
import { AIAgent, BusinessProcess } from '@/src/types/agent';
import { Modal } from '@/src/components/common/modal';
import { showToast } from '@/src/components/common/toast-notification';
import { HeaderActions } from '@/src/components/layout/header-actions';

const DragDropContext = dynamic(
  () => import('@hello-pangea/dnd').then((m: any) => m.DragDropContext),
  { ssr: false }
) as any;
const Droppable = dynamic(
  () => import('@hello-pangea/dnd').then((m: any) => m.Droppable),
  { ssr: false }
) as any;
const Draggable = dynamic(
  () => import('@hello-pangea/dnd').then((m: any) => m.Draggable),
  { ssr: false }
) as any;

export function AIAgentsView() {
  const [agents, setAgents] = useState<AIAgent[]>(mockAgents ?? []);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [editedProcesses, setEditedProcesses] = useState<BusinessProcess[]>([]);

  const openAgent = useCallback((agent: AIAgent) => {
    setSelectedAgent(agent);
    setEditedProcesses([...(agent?.processes ?? [])]);
  }, []);

  const handleDragEnd = useCallback((result: any) => {
    if (!result?.destination) return;
    const items = Array.from(editedProcesses ?? []);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setEditedProcesses(items.map((p: BusinessProcess, i: number) => ({ ...(p ?? {}), order: i + 1 })));
  }, [editedProcesses]);

  const toggleProcessStatus = useCallback((processId: string) => {
    setEditedProcesses((prev: BusinessProcess[]) => (prev ?? []).map((p: BusinessProcess) =>
      p?.id === processId ? { ...(p ?? {}), status: p?.status === 'active' ? 'inactive' : 'active' } : p
    ));
  }, []);

  const saveOrder = useCallback(() => {
    if (!selectedAgent) return;
    setAgents((prev: AIAgent[]) => (prev ?? []).map((a: AIAgent) =>
      a?.id === selectedAgent?.id ? { ...(a ?? {}), processes: editedProcesses } : a
    ));
    showToast('Порядок сохранён', 'success');
  }, [selectedAgent, editedProcesses]);

  const runAgent = useCallback(() => {
    showToast(`Агент "${selectedAgent?.name ?? ''}" запущен`, 'success');
  }, [selectedAgent]);

  return (
    <div className="px-6 pt-6">
      <div className="flex justify-end mb-6"><HeaderActions /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(agents ?? []).map((agent: AIAgent) => (
          <div key={agent?.id} className="bg-[#1A1A2E] rounded-xl border border-border/30 p-5 hover:border-border/60 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#EF4444]/10 flex items-center justify-center"><Bot className="w-5 h-5 text-[#EF4444]" /></div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${agent?.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                {agent?.status === 'active' ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            <h3 className="text-sm font-semibold mb-1">{agent?.name}</h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{agent?.description}</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <span className="font-mono">{agent?.runsCount}</span> запусков • {agent?.processes?.length ?? 0} процессов
              </div>
              <button onClick={() => openAgent(agent)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors flex items-center gap-1">
                <SettingsIcon className="w-3.5 h-3.5" /> Настроить
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedAgent} onClose={() => setSelectedAgent(null)} title={selectedAgent?.name ?? ''} maxWidth="max-w-3xl">
        {selectedAgent && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{selectedAgent?.description}</p>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedAgent?.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                {selectedAgent?.status === 'active' ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Категория: {selectedAgent?.category} • Последний запуск: {selectedAgent?.lastRun ?? 'Никогда'}</div>

            <h3 className="text-sm font-semibold">Бизнес-процессы (перетаскивайте для изменения порядка)</h3>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="processes">
                {(provided: any) => (
                  <div ref={provided?.innerRef} {...(provided?.droppableProps ?? {})} className="space-y-2">
                    {(editedProcesses ?? []).map((proc: BusinessProcess, idx: number) => (
                      <Draggable key={proc?.id} draggableId={proc?.id ?? `p-${idx}`} index={idx}>
                        {(provided2: any, snapshot: any) => (
                          <div
                            ref={provided2?.innerRef}
                            {...(provided2?.draggableProps ?? {})}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              snapshot?.isDragging ? 'bg-[#EF4444]/10 border-[#EF4444]/30' : 'bg-white/5 border-border/20'
                            }`}
                          >
                            <div {...(provided2?.dragHandleProps ?? {})} className="pt-1 cursor-grab">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#EF4444]/20 flex items-center justify-center text-xs font-bold text-[#EF4444] shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{proc?.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{proc?.description}</div>
                              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                <span>Триггер: <span className="text-foreground">{proc?.trigger}</span></span>
                                <span>Действие: <span className="text-foreground">{proc?.action}</span></span>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleProcessStatus(proc?.id ?? '')}
                              className={`px-2 py-1 rounded text-[10px] font-medium shrink-0 ${
                                proc?.status === 'active' ? 'bg-green-500/10 text-green-400' :
                                proc?.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-gray-500/10 text-gray-400'
                              }`}
                            >
                              {proc?.status === 'active' ? 'Активен' : proc?.status === 'pending' ? 'Ожидание' : 'Неактивен'}
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided?.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="flex gap-3 pt-2">
              <button onClick={saveOrder} className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">Сохранить порядок</button>
              <button onClick={runAgent} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
                <Play className="w-4 h-4" /> Запустить агента
              </button>
              <button onClick={() => setSelectedAgent(null)} className="px-6 bg-white/5 hover:bg-white/10 py-2.5 rounded-lg text-sm font-medium transition-colors">Закрыть</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
