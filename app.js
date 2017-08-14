(async() => {
  let fields = localStorage.getItem('fields');
  if (!fields) {
    fields = [];
  } else {
    fields = JSON.parse(fields);
  }
  let _version = 1;
  let schemaBuilder = lf.schema.create('test', _version);


  let table = schemaBuilder.createTable('Items');
  fields.forEach(f => table.addColumn(f.name, f.type));

  let observableFields = ko.observableArray(fields);

  let db = await schemaBuilder.connect();
  let Items = db.getSchema().table('Items');
  let results = await db.select().from(Items).exec();
  db.close();

  results = ko.observableArray(results || []);

  ko.applyBindings({
    selectedFieldType: "5",
    fieldName: ko.observable(""),
    fields: observableFields,
    items: results,
    addField: async(view, evt) => {
      if (view.fieldName() && (ko.utils.arrayFilter(fields, f => f.fieldName === view.fieldName)).length === 0) {
        view.fields.push({ name: view.fieldName(), type: parseInt(view.selectedFieldType) });
        localStorage.setItem('fields', ko.toJSON(view.fields));
        table.addColumn(view.fieldName(), parseInt(view.selectedFieldType));
        db = await schemaBuilder.connect();
        db.close();
        view.fieldName("");
      }
    },
    addNewItem: async(view, evt) => {
      let inputs = document.querySelectorAll('[data-name]');
      let rowData = {};
      [].forEach.call(inputs, i => {
        rowData[i.getAttribute('data-name')] = (i.value || null);
      });

      let db = await schemaBuilder.connect();
      let Items = db.getSchema().table('Items');
      const row = Items.createRow(rowData);
      await db.insert().into(Items).values([row]).exec()
        .then(
          (addedRows) => {
            view.items.push(rowData);
            [].forEach.call(inputs, i => {
              i.value = "";
            });
          },
          (err) => console.log('Error: ', err.message)
        );
      db.close();
    }
  });

})();