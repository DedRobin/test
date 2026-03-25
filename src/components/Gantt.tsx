import { useState, type KeyboardEventHandler } from 'react';
import type { IApi, ITask } from '@svar-ui/react-gantt';
import {
  Gantt,
  WillowDark,
  Editor,
  Toolbar,
  ContextMenu,
} from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';

const tasks: ITask[] = [
  {
    id: 1,
    text: 'Task 1',
    start: new Date(2024, 0, 3),
    end: new Date(2024, 0, 20),
    progress: 50,
    type: 'task',
  },
  {
    id: 2,
    text: 'Task 2',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 25),
    progress: 30,
    type: 'task',
  },
];

const links = [
  { id: 1, source: 1, target: 2, type: 'e2e' },
  // { id: 2, source: 3, target: 5, type: 'e2s' },
  // { id: 3, source: 5, target: 6, type: 's2s' },
  // { id: 4, source: 6, target: 7, type: 'e2s' },
  // { id: 5, source: 7, target: 8, type: 'e2s' },
  // { id: 6, source: 8, target: 9, type: 'e2s' },
];

const scales = [
  { unit: 'month', step: 1, format: '%M %Y' },
  { unit: 'week', step: 1, format: 'Week %w' },
];

export default function GanttChart() {
  const [api, setApi] = useState<IApi | undefined>();

  const init: (api: IApi) => void = (api) => {
    api.on('add-link', () => {
      console.log('add link');
    });
    api.on('copy-task', () => {
      console.log('copy task');
    });
    api.on('drag-task', () => {
      console.log('dragging');
    });

    setApi(api);
  };

  const onKeyDown: KeyboardEventHandler = (event) => {
    if (event.ctrlKey && event.key === 'z') {
      console.log('CtrlZ');
    }
  };

  return (
    <div
      onKeyDown={onKeyDown}
      style={{
        height: '100%',
        width: '100%',
      }}
    >
      <WillowDark>
        <Toolbar api={api} />
        <ContextMenu api={api}>
          <Gantt
            tasks={tasks}
            links={links}
            scales={scales}
            init={init}
          />
        </ContextMenu>
        {api && <Editor api={api} />}
      </WillowDark>
    </div>
  );
}
