module.exports = (plop) => {
  plop.setGenerator("controller", {
    description: "application controller logic",

    actions: [
      {
        type: "add",
        path: "models/{{tableName}}/{{tableName}}.js",
        templateFile: "./templates/model.js.hbs",
        force: true,
        transform: (x) => {
          const prettier = require("prettier");
          return prettier.format(x, {
            parser: "babel",
          });
        },
      },
    ],
  });
};
