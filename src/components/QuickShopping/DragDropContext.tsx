import React, { createContext, useContext, useState, useCallback } from "react";

interface DragDropContextType {
  draggedItem: any;
  draggedType: "category" | "product" | null;
  draggedFromCategory: string | null;
  isDragging: boolean;
  startDrag: (
    item: any,
    type: "category" | "product",
    fromCategory?: string
  ) => void;
  endDrag: () => void;
  onDrop: (
    targetItem: any,
    targetType: "category" | "product",
    targetCategory?: string
  ) => void;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error("useDragDrop must be used within a DragDropProvider");
  }
  return context;
};

interface DragDropProviderProps {
  children: React.ReactNode;
  onItemMove: (
    draggedItem: any,
    targetItem: any,
    draggedType: "category" | "product",
    targetType: "category" | "product",
    draggedFromCategory?: string,
    targetCategory?: string
  ) => void;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  onItemMove,
}) => {
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [draggedType, setDraggedType] = useState<"category" | "product" | null>(
    null
  );
  const [draggedFromCategory, setDraggedFromCategory] = useState<string | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = useCallback(
    (item: any, type: "category" | "product", fromCategory?: string) => {
      setDraggedItem(item);
      setDraggedType(type);
      setDraggedFromCategory(fromCategory || null);
      setIsDragging(true);
    },
    []
  );

  const endDrag = useCallback(() => {
    setDraggedItem(null);
    setDraggedType(null);
    setDraggedFromCategory(null);
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (
      targetItem: any,
      targetType: "category" | "product",
      targetCategory?: string
    ) => {
      if (draggedItem && draggedType) {
        onItemMove(
          draggedItem,
          targetItem,
          draggedType,
          targetType,
          draggedFromCategory || undefined,
          targetCategory
        );
      }
      endDrag();
    },
    [draggedItem, draggedType, draggedFromCategory, onItemMove, endDrag]
  );

  const contextValue: DragDropContextType = {
    draggedItem,
    draggedType,
    draggedFromCategory,
    isDragging,
    startDrag,
    endDrag,
    onDrop,
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
};
