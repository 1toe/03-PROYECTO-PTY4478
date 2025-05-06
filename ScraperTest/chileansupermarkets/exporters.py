from scrapy.exporters import JsonItemExporter
import json

class JsonItemExporter(JsonItemExporter):
    """
    Custom JSON exporter that outputs an object instead of a list.
    Each item will be added as an entry in the object, using the item's SKU as key.
    """
    
    def __init__(self, file, **kwargs):
        # Don't pass these args to parent constructor
        indent = kwargs.pop('indent', None)
        ensure_ascii = kwargs.pop('ensure_ascii', True)
        
        # Call the parent constructor without these args
        super(JsonItemExporter, self).__init__(file, **kwargs)
        
        # Set the args again in the encoder
        self.encoder = json.JSONEncoder(ensure_ascii=ensure_ascii, indent=indent)
        
        # Initialize our object that will store all items
        self.items = {}
        
        # Write the start of the JSON object
        self.file.write(b'{')
        self.first_item = True
    
    def export_item(self, item):
        if self.first_item:
            self.first_item = False
        else:
            self.file.write(b',')
        
        # Use SKU as key, or generate a unique key if SKU is not available
        sku = item.get('sku', f"item_{len(self.items)}")
        
        # Convert the key to JSON string
        key = self.encoder.encode(sku)
        
        # Convert the item to JSON
        data = self.encoder.encode(dict(self._get_serialized_fields(item)))
        
        # Write the key-value pair
        self.file.write(key.encode('utf-8'))
        self.file.write(b':')
        self.file.write(data.encode('utf-8'))
        
        # Store for our records
        self.items[sku] = item
    
    def finish_exporting(self):
        self.file.write(b'}')
        self.file.close()
