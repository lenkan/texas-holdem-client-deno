
# Install deno

https://deno.land/#installation

# Install vscode deno plugin

https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno

You might want to disable this by default so it doesn't interfere with other typescript or node.js projects.

# Start the poker sever

For training, start the poker server locally using docker:

```
docker run --rm -p 8080:80 -p 4711:4711 cygni/texasholdem:server-1.1.23
```

# Create a bot

Create a file called `my_bot.ts`.

```ts
// my_bot.ts
import { start } from "https://raw.githubusercontent.com/lenkan/texas-holdem-client-deno/v0.1.0/mod.ts";

const playerName = Deno.args[0];

const result = await start(
  { name: playerName, room: "TRAINING" },
  async (actions, table) => {
    const { raiseAction, callAction, checkAction } = actions;

    console.log(table.myCards); // [{ rank: "ACE", suit: "CLUBS" }]
    console.log(table.myHand); // [{ name: "High Card", rank: 1 }]
    console.log(table.pot); // 1000

    return checkAction || callAction;
  },
);

// Result is the state of the table after the final showdown.
console.log("Finished", JSON.stringify(result, null, 2));
```

# Start 

Run the bot using deno

```
deno run --allow-net my_bot.ts botvar
```
