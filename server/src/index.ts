import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createStudentInputSchema,
  updateStudentInputSchema,
  getStudentByIdInputSchema,
  deleteStudentInputSchema
} from './schema';

// Import handlers
import { createStudent } from './handlers/create_student';
import { getStudents } from './handlers/get_students';
import { getStudentById } from './handlers/get_student_by_id';
import { updateStudent } from './handlers/update_student';
import { deleteStudent } from './handlers/delete_student';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Student CRUD operations
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),
    
  getStudents: publicProcedure
    .query(() => getStudents()),
    
  getStudentById: publicProcedure
    .input(getStudentByIdInputSchema)
    .query(({ input }) => getStudentById(input)),
    
  updateStudent: publicProcedure
    .input(updateStudentInputSchema)
    .mutation(({ input }) => updateStudent(input)),
    
  deleteStudent: publicProcedure
    .input(deleteStudentInputSchema)
    .mutation(({ input }) => deleteStudent(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Student Management TRPC server listening at port: ${port}`);
}

start();