import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));

app.listen({ port: 4011 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log("LISTENING", address);
});
