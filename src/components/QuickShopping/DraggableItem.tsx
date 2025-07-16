import React from "react";
import { GripVertical } from "lucide-react";
import { useDragDrop } from "./DragDropContext";

interface DraggableItemProps {
  item: any;
  type: "category" | "product";
  fromCategory?: string;
  children: React.ReactNode;
  className?: string;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  type,
  fromCategory,
  children,
  className = "",
}) => {
  const { startDrag, endDrag, onDrop, isDragging, draggedItem, draggedType } =
    useDragDrop();

  const handleDragStart = (e: React.DragEvent) => {
    startDrag(item, type, fromCategory);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(item, type, fromCategory);
  };

  const handleDragEnd = () => {
    endDrag();
  };

  const isBeingDragged =
    isDragging && draggedItem === item && draggedType === type;
  const canDrop = isDragging && (draggedItem !== item || draggedType !== type);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={`
        group relative cursor-move transition-all duration-200
        ${isBeingDragged ? "opacity-50 transform scale-95" : ""}
        ${
          canDrop
            ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700"
            : ""
        }
        ${className}
      `}
    >
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <div className="pl-8">{children}</div>
    </div>
  );
};
