import { useEffect, useState } from 'react';
import type { IApi } from '@svar-ui/react-gantt';
import {
  Gantt,
  WillowDark,
  Editor,
  Toolbar,
  ContextMenu,
} from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';

const tasks = [
  {
    id: 1,
    text: 'Task 1',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 10),
    progress: 50,
    type: 'task',
    // open: true,
  },
  {
    id: 2,
    text: 'Task 2',
    start: new Date(2024, 0, 1),
    end: new Date(2024, 0, 25),
    progress: 30,
    type: 'task',
    // parent: 1,
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
  const [api, setApi] = useState<IApi | undefined>(undefined);

  useEffect(() => console.log(api), [api]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <WillowDark>
        <Toolbar api={api} />
        <ContextMenu api={api}>
          <Gantt
            tasks={tasks}
            links={links}
            scales={scales}
            init={setApi}
          />
        </ContextMenu>
        {api && <Editor api={api} />}
      </WillowDark>
    </div>
  );
}
