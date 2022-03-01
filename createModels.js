const express = require("express");
const knex = require("./knexInstance");
const schemaInspector = require("knex-schema-inspector").default;
const { generateModel } = require("./utils");
const inspector = schemaInspector(knex);
const dataTypes = (type) => {
  /*
   * Possible types in database
   * ================
   * varchar    bigint    longtext
   * datetime    int    tinyint
   * decimal    double    tinytext
   * text    timestamp    date
   * mediumtext    float    smallint
   * char    enum    blob
   * longblob    set
   *
   * Types available in json schema
   * string    number    object
   * array    boolean    null
   * integer    any
   *
   */
  switch (type) {
    case "boolean":
      return "boolean";
    case "array":
      return "array";
    case "varchar":
    case "longtext":
    case "tinytext":
    case "text":
    case "mediumtext":
    case "char":
      return "string";
    case "date":
      return "date";
    case "datetime":
      return "date-time";
    case "bigint":
    case "int":
    case "tinyint":
    case "smallint":
    case "timestamp":
      return "integer";
    case "decimal":
    case "double":
    case "float":
      return "number";
    default:
      return "any";
  }
};
/*
TODO: MAKE SURE THAT DELETIONS WORK PROPERLY IN THE STATIC CLASS FUNCTIONS

TODO: defintely have to REFACTOR CODE
TODO: ENSURE THAT DATA CAN BE INSERTED WITH MULTIPLE DIFFERENT TABLES
      
      





*/

function genMediaCols(table) {
  //make this dynamic, before creating model, access virtual media columns...
  const mediaColumns = [
    {
      name: "images",
      multi: true,
    },
    {
      name: "thumbnail",
      multi: false,
    },
  ];
  const columns = mediaColumns.map((item) => {
    return {
      name: item.name,
      table,
      type: "media",
      is_generated: false,
      media: JSON.stringify({
        multi: item.multi,
      }),
      default_value: false,
      is_foreign_key: false,
      is_nullable: true,
      data_type: item.multi ? "array" : "char",
    };
  });

  return columns;
}
async function main() {
  const has_media = await knex("entity_type").where("has_media", true);

  const tables = await inspector.tableInfo();

  for (const item of tables) {
    const media_check = has_media.find((mediaItem) => {
      return mediaItem.name === item.name;
    });

    const columns = await inspector.columnInfo(item.name);
    if (media_check) {
      columns.push(...genMediaCols(item.name));
    }

    const formattedCols = columns.map((item) => {
      const orig = {
        name: item.name,
        table: item.table,
        type: dataTypes(item.data_type),
        user_field:
          (!item.is_primary_key && item.is_generated) ||
          item.default_value === "CURRENT_TIMESTAMP"
            ? false
            : true,
        is_generated:
          item.is_generated || item.default_value === "CURRENT_TIMESTAMP",
        default_value: item.default_value ? item.default_value : false,
        is_foreign_key: Boolean(item.foreign_key_column),
        required: item.is_nullable === false,
        nullable: item.is_nullable,
      };
      if (item.name === "m_order") {
        
        orig["is_generated"] = true;
        orig["user_field"] = false;
      }
      return {
        schema: orig,
        clientCols: {
          ...item,
          media: item.media,
          ...orig,
        },
      };
    });

    generateModel(item.name, formattedCols, media_check);
  }
  knex.destroy();
}
main();
