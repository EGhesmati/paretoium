import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: [".env.local", ".env"] });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the curriculum.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const courses = [
  ["CS101", "Intro to Computer Science", "Foundations of computing.", 20, 1],
  ["CS102", "Data Structures & Algorithms", "Core data structures and algorithms.", 40, 2],
  ["CS201", "Computer Architecture", "Processors, memory, and machine-level execution.", 35, 3],
  ["CS202", "Operating Systems", "Processes, memory, and concurrent systems.", 45, 4],
  ["CS203", "Database Systems", "Relational modeling, queries, and transactions.", 30, 2],
  ["CS301", "Networking", "Protocols, routing, and networked applications.", 30, 3],
  ["CS302", "Distributed Systems", "Reliability and coordination across machines.", 50, 5],
  ["CS303", "Compiler Design", "Parsing, analysis, and code generation.", 50, 5],
  ["MATH101", "Discrete Mathematics", "Logic, sets, combinatorics, and graphs.", 25, 2],
  ["MATH102", "Linear Algebra", "Vectors, matrices, and linear transformations.", 30, 3],
  ["AI101", "Intro to AI", "Search, agents, and introduction to learning.", 35, 3],
  ["AI102", "Machine Learning", "Models, training, and evaluation.", 45, 4],
  ["WEB101", "Web Development Fundamentals", "HTML, CSS, JavaScript, and browser basics.", 15, 1],
  ["WEB102", "Full-Stack Web Dev", "APIs, databases, and modern web applications.", 35, 3],
  ["CAP500", "Capstone Project", "An integrated software project.", 60, 5],
] as const;

const prerequisites = [
  ["CS101", "CS102", "AND"],
  ["MATH101", "CS102", "AND"],
  ["CS102", "CS201", "AND"],
  ["CS201", "CS202", "AND"],
  ["CS102", "CS203", "AND"],
  ["CS202", "CS301", "AND"],
  ["CS301", "CS302", "AND"],
  ["CS203", "CS302", "AND"],
  ["CS102", "CS303", "AND"],
  ["MATH102", "AI101", "AND"],
  ["CS102", "AI101", "AND"],
  ["AI101", "AI102", "AND"],
  ["CS101", "WEB101", "AND"],
  ["WEB101", "WEB102", "AND"],
  ["CS203", "WEB102", "OR"],
  ["CS302", "CAP500", "AND"],
  ["WEB102", "CAP500", "AND"],
] as const;

async function main() {
  for (const [code, title, description, studyHours, difficulty] of courses) {
    await prisma.course.upsert({
      where: { code },
      update: { title, description, studyHours, difficulty },
      create: { code, title, description, studyHours, difficulty },
    });
  }

  for (const [code, title, description, studyHours, difficulty] of courses) {
    await prisma.topicNode.upsert({
      where: { courseId_title: { courseId: (
        await prisma.course.findUniqueOrThrow({ where: { code } })
      ).id, title } },
      update: { description },
      create: {
        title,
        description,
        course: { connect: { code } },
      },
    });
  }

  for (const [fromCode, toCode] of prerequisites) {
    const fromCourse = await prisma.course.findUniqueOrThrow({ where: { code: fromCode } });
    const toCourse = await prisma.course.findUniqueOrThrow({ where: { code: toCode } });
    const fromNode = await prisma.topicNode.findFirstOrThrow({
      where: { courseId: fromCourse.id },
    });
    const toNode = await prisma.topicNode.findFirstOrThrow({
      where: { courseId: toCourse.id },
    });

    await prisma.edge.upsert({
      where: { sourceId_targetId: { sourceId: fromNode.id, targetId: toNode.id } },
      update: {},
      create: { sourceId: fromNode.id, targetId: toNode.id },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
