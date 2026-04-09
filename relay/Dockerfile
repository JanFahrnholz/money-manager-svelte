FROM denoland/deno:2.0.0

WORKDIR /app
COPY main.ts deno.json ./

EXPOSE 8090
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--unstable-kv", "main.ts"]
