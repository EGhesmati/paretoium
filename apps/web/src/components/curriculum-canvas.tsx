"use client";

import "@xyflow/react/dist/style.css";
import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";

export interface CanvasCourse {
  id: string;
  code: string;
  title: string;
  studyHours: number;
  difficulty: number;
}

export interface CanvasEdge {
  sourceId: string;
  targetId: string;
  sourceCode: string;
  targetCode: string;
}

export function CurriculumCanvas({
  courses,
  edges,
}: {
  courses: CanvasCourse[];
  edges: CanvasEdge[];
}) {
  const courseIndex = new Map(courses.map((course, index) => [course.id, index]));
  const nodes: Node[] = courses.map((course) => {
    const index = courseIndex.get(course.id) ?? 0;
    return {
      id: course.id,
      position: {
        x: (index % 5) * 220,
        y: Math.floor(index / 5) * 150,
      },
      data: {
        label: (
          <div className="canvas-node">
            <span className="canvas-node-code">{course.code}</span>
            <strong>{course.title}</strong>
            <small>{course.studyHours}h · difficulty {course.difficulty}</small>
          </div>
        ),
      },
      type: "default",
    };
  });

  const flowEdges: Edge[] = edges.map((edge) => ({
    id: `${edge.sourceId}-${edge.targetId}`,
    source: edge.sourceId,
    target: edge.targetId,
    animated: false,
    label: `${edge.sourceCode} → ${edge.targetCode}`,
    style: { stroke: "#5b91a3", strokeWidth: 1.5 },
  }));

  return (
    <ReactFlow
      nodes={nodes}
      edges={flowEdges}
      fitView
      minZoom={0.35}
      maxZoom={1.5}
      nodesConnectable={false}
      nodesDraggable
    >
      <Background color="#cfeae0" gap={24} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
