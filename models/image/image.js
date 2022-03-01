const { Model, snakeCaseMappers } = require("objection");
const AjvValidator = require("objection").AjvValidator;
const cursorMixin = require("objection-cursor");
const cursor = cursorMixin({
  limit: 20,
  pageInfo: {
    total: true,
    hasNext: true,
  },
});
class Image extends cursor(Model) {
  static get tableName() {
    return "image";
  }

  static get clientCols() {
    return {
      height: {
        type: "integer",
        db_name: "height",
        is_generated: false,

        foreign_key: false,

        required: false,
      },
      main: {
        type: "boolean",
        db_name: "main",
        is_generated: false,

        foreign_key: false,

        required: false,
      },
      uid: {
        type: "string",
        db_name: "uid",
        is_generated: true,

        foreign_key: false,

        required: true,
      },
      url: {
        type: "string",
        db_name: "url",
        is_generated: false,

        foreign_key: false,

        required: false,
      },
      width: {
        type: "integer",
        db_name: "width",
        is_generated: false,

        foreign_key: false,

        required: false,
      },
    };
  }

  static get jsonSchema() {
    return {
      type: "object",

      properties: {
        height: {
          type: "integer",
          nullable: true,
        },

        main: {
          type: "boolean",
          nullable: true,
        },

        parentId: {
          type: "string",
          nullable: true,
        },

        url: {
          type: "string",
          nullable: true,
        },

        width: {
          type: "integer",
          nullable: true,
        },
      },
    };
  }
}

module.exports = {
  model: Image,
};
