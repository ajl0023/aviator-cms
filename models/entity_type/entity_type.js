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
class Entity_type extends cursor(Model) {
  static get tableName() {
    return "entity_type";
  }

  static get clientCols() {
    return {
      has_media: {
        type: "boolean",
        db_name: "has_media",
        is_generated: false,

        foreign_key: false,

        required: false,
      },
      name: {
        type: "string",
        db_name: "name",
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
    };
  }

  static get jsonSchema() {
    return {
      type: "object",

      properties: {
        has_media: {
          type: "boolean",
          nullable: true,
        },

        name: {
          type: "string",
          nullable: true,
        },
      },
    };
  }
}

module.exports = {
  model: Entity_type,
};
