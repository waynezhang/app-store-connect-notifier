class App {
  constructor(response) {
    this.id = response.id;
    this.name = response.attributes.name;
    this.bundleId = response.attributes.bundleId;
  }
}

module.exports = App;
