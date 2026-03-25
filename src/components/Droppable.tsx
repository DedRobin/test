import { useDroppable } from '@dnd-kit/react';

export default function Droppable({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { ref } = useDroppable({
    id,
  });

  return (
    <div
      ref={ref}
      style={{ border: '1px solid red' }}
    >
      {children}
    </div>
  );
}
