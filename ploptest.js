module.exports = async (data) => {
  const { default: nodePlop } = await import("node-plop");

  // load an instance of plop from a plopfile
  const plop = await nodePlop("./plopfile.js");
  // get a generator by name
  const basicAdd = plop.getGenerator("controller");

  // run all the generator actions using the data specified

 
  basicAdd.runActions(data).then(function (results) {
    
    // do something after the actions have run
  });
};
