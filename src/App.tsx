// import { useMemo, useRef } from 'react';
import './App.css';
// import GanttComponent from './components/Gantt';
import '@svar-ui/react-gantt/all.css';
// import { SplitPane, Pane } from 'react-split-pane';
import { DragDropProvider } from '@dnd-kit/react';
import Draggable from './components/Draggable';
// import { RestrictToHorizontalAxis } from '@dnd-kit/abstract/modifiers';
// import Droppable from './components/Droppable';
import { useState } from 'react';
import Droppable from './components/Droppable';

function App() {
  // const dividerStyle = useMemo(
  //   () => ({ background: 'grey', width: '10px' }),
  //   [],
  // );

  return (
    // <SplitPane
    //   direction="horizontal"
    //   dividerStyle={dividerStyle}
    // >
    //   <Pane>
    //     <GanttComponent />;
    //   </Pane>
    //   <Pane>
    //     <GanttComponent />;
    //   </Pane>
    // </SplitPane>
    <div
      style={{
        width: '50%',
        height: '50%',
        border: '3px white solid',
        borderRadius: '10px',
        position: 'relative',
      }}
    >
      <DragDropProvider
        onDragEnd={(event) => {
          const element = event.operation.source?.element;

          if (!element) return;

          const { x: deltaX, y: deltaY } = event.operation.transform;

          console.log(deltaX, deltaY);
        }}
      >
        <Draggable />
      </DragDropProvider>
    </div>
  );
}

export default App;
