# Install

npm
```
npm install ltxml
```

bower
```
bower install ltxml
```

# Contribute

build
```
npm run build
```

watch build
```
npm run watch
```

# API

## Ltxml
```
Ltxml.clearCache()
```

## XName
```
new XName(namespace, name)      // namespace is an XNamespace object, name is string
new XName(name)                 // name is string, is in no namespace
new XName(name)                 // name = '{namespaceURI}name'
XName.get(expandedName)
XName.get(namespace, localName)
XName.toString()

/* props implemented as fields */
XName.localName
XName.namespace
XName.namespaceName
```

## XNamespace
```
new XNamespace(uri)
XNamespace.get(uri)
XNamespace.getName(localName)
XNamespace.toString()

/* props implemented as fields */
XNamespace.namespaceName

/* static props */
XNamespace.getNone()               // returns namespace for 'no namespace'
XNamespace.none

XNamespace.getXml()                // http://www.w3.org/XML/1998/namespace
XNamespace.xml

XNamespace.getXmlns()              // http://www.w3.org/2000/xmlns/
XNamespace.xmlns
```

## XObject (abstract)
```
XObject.addAnnotation(type, object)  // type is string
XObject.annotation(type)
XObject.annotations(type)
XObject.removeAnnotations
XObject.removeAnnotations(type)

/* props implemented as fields */
XObject.nodeType
XObject.parent

/* props */
XObject.getDocument()
XObject.document
```

## XNode: XObject (abstract)
```
XNode.addAfterSelf(varargs)
XNode.addBeforeSelf(varargs)
XNode.ancestors()
XNode.ancestors(xname)
XNode.deepEquals
XNode.elementsAfterSelf()
XNode.elementsAfterSelf(xname)
XNode.elementsBeforeSelf()
XNode.elementsBeforeSelf(xname)
XNode.nodesAfterSelf()
XNode.nodesBeforeSelf()
XNode.remove()
XNode.replaceWith(content)

/* props implemented as fields */
XNode.nodeType
XNode.parent

/* props */
XNode.getNextNode()
XNode.nextNode

XNode.getPreviousNode()
XNode.previousNode
```

## XAttribute: XObject
```
new XAttribute(name, value)
new XAttribute(XAttribute)
XAttribute.remove()
XAttribute.setValue(value)
XAttribute.toString()

/* props implemented as fields */
XAttribute.isNamespaceDeclaration
XAttribute.name
XAttribute.nodeType
XAttribute.parent
XAttribute.value

/* props */
XAttribute.getNextAttribute()
XAttribute.nextAttribute

XAttribute.getPreviousAttribute()
XAttribute.previousAttribute
```

## XComment: XNode
```
new XComment(value)
new XComment(xcomment)
XComment.toString()
XComment.toString(indent)

/* props implemented as fields */
XComment.nodeType
XComment.parent
XComment.value
```

## XContainer: XNode
```
XContainer.add(content)
XContainer.addFirst(content)
XContainer.descendantNodes
XContainer.descendants()
XContainer.descendants(xname)
XContainer.element(xname)
XContainer.elements()
XContainer.elements(xname)
XContainer.nodes()
XContainer.removeNodes()
XContainer.replaceNodes(content)

/* props implemented as fields */
XContainer.nodeType
XContainer.parent

/* props */
XContainer.getFirstNode()
XContainer.firstNode

XContainer.getLastNode()
XContainer.lastNode
```

## XDeclaration
```
new XDeclaration(version, encoding, standalone)
new XDeclaration(xdeclaration)
XDeclaration.toString(indent)

/* props implemented as fields */
XDeclaration.encoding
XDeclaration.standalone
XDeclaration.version
```

## XDocument: XContainer
```
new XDocument()
new XDocument(content)
new XDocument(xdocument)
new XDocument(xdeclaration, content)
XDocument.descendants()
XDocument.descendants(xname)
XDocument.parse(xml)
XDocument.load(XMLDocument)
XDocument.toString()
XDocument.toString(indent)

/* props implemented as fields */
XDocument.nodeType
XDocument.parent
XDocument.declaration

/* props */
XDocument.getRoot()
XDocument.root
```

## XElement: XContainer
```
new XElement(xelement)          copy constructor
new XElement(xname)
new XElement(xname, varargs)
XElement.ancestorsAndSelf()
XElement.ancestorsAndSelf(xname)
XElement.attribute(xname)
XElement.attributes()
XElement.attributes(xname)
XElement.descendantNodesAndSelf()
XElement.descendantsAndSelf()
XElement.descendantsAndSelf(xname)
XElement.getDefaultNamespace()
XElement.getNamespaceOfPrefix()
XElement.getPrefixOfNamespace()
XElement.load(XMLDocument)
XElement.parse()
XElement.removeAll()
XElement.removeAttributes()
XElement.replaceAll(content)
XElement.replaceAttributes(content)
XElement.setAttributeValue(xname, value)
XElement.setElementValue(xname, value)
XElement.toString()
XElement.toString(indent)

/* props implemented as fields */
XElement.name
XElement.nodeType
XElement.parent

/* props */
XElement.getFirstAttribute()
XElement.firstAttribute

XElement.getHasAttributes()
XElement.hasAttributes

XElement.getHasElements()
XElement.hasElements

XElement.getIsEmpty()
XElement.isEmpty

XElement.getLastAttribute()
XElement.lastAttribute

XElement.getValue
XElement.setValue()
XElement.value
```

## XProcessingInstruction: XNode
```
new XProcessingInstruction(xprocessingInstruction)
new XProcessingInstruction(target, data)
XProcessingInstruction.toString()
XProcessingInstruction.toString(indent)

/* props implemented as fields */
XProcessingInstruction.data
XProcessingInstruction.nodeType
XProcessingInstruction.parent
XProcessingInstruction.target
```

## XText: XNode
```
new XText(value)
new XText(XText)
XText.toString()

/* props implemented as fields */
XText.nodeType
XText.parent
XText.value
```

## XEntity: XNode
```
new XEntity(value)
new XEntity(XEntity)
XEntity.toString()

/* props implemented as fields */
XEntity.nodeType
XEntity.parent
XEntity.value
```

## XCData: XText
```
new XCData(value)
new XCData(XCData)
XCData.toString()

/* props implemented as fields */
XCData.nodeType
XCData.parent
XCData.value
```

## Extension methods
```
ancestors()
ancestors(xname)
ancestorsAndSelf()
ancestorsAndSelf(xname)
attributes()
attributes(xname)
descendantNodes()
descendantNodesAndSelf()
descendants()
descendants(xname)
descendantsAndSelf()
descendantsAndSelf(xname)
elements()
elements(xname)
nodes()
remove(xname)
```
