// =========================================================================
//
// tinyxmlxpath.js - a partially W3C compliant XPath parser for XML for <SCRIPT> (compressed)
//
// version 3.1
//
// =========================================================================
//
// Copyright (C) 2003 Jon van Noort <jon@webarcana.com.au> and David Joham <djoham@yahoo.com>
//
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 2.1 of the License, or (at your option) any later version.

// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.

// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
//
// visit the XML for <SCRIPT> home page at xmljs.sourceforge.net
//
// Contributor - Jon van Noort <jon@webarcana.com.au>
//
// Contains code derived from works by Mark Bosley & Fred Baptiste
//  (see: http://www.topxml.com/people/bosley/strlib.asp)
//
// Contains text (used within comments to methods) from the
//  XML Path Language (XPath) Version 1.0 W3C Recommendation
//  Copyright © 16 November 1999 World Wide Web Consortium,
//  (Massachusetts Institute of Technology,
//  European Research Consortium for Informatics and Mathematics, Keio University).
//  All Rights Reserved.
//  (see: http://www.w3.org/TR/xpath)
//
DOMNode.NODE_TYPE_TEST = 1; DOMNode.NODE_NAME_TEST = 2; DOMNode.ANCESTOR_AXIS = 1; DOMNode.ANCESTOR_OR_SELF_AXIS = 2; DOMNode.ATTRIBUTE_AXIS = 3; DOMNode.CHILD_AXIS = 4; DOMNode.DESCENDANT_AXIS = 5; DOMNode.DESCENDANT_OR_SELF_AXIS = 6; DOMNode.FOLLOWING_AXIS = 7; DOMNode.FOLLOWING_SIBLING_AXIS = 8; DOMNode.NAMESPACE_AXIS = 9; DOMNode.PARENT_AXIS = 10; DOMNode.PRECEDING_AXIS = 11; DOMNode.PRECEDING_SIBLING_AXIS = 12; DOMNode.SELF_AXIS = 13; DOMNode.ROOT_AXIS = 14; DOMNode.prototype.getStringValue = function() { var thisBranch = this._getDescendantOrSelfAxis(); var textNodes = thisBranch.getTypedItems(DOMNode.TEXT_NODE); var stringValue = ""; if (textNodes.length > 0) { stringValue += textNodes.item(0).nodeValue; for (var i=1; i < textNodes.length ; i++) { stringValue += " "+ textNodes.item(i).nodeValue;}
}
return stringValue;}; DOMNode.prototype._filterByAttributeExistance = function(expr, containerNodeSet) { try { if (expr.indexOf("*") < 0) { var attributeName = expr.substr(1, expr.length); var attribute = this.getAttributes().getNamedItem(attributeName); if (attribute != null) { return true;}
else { return false;}
}
else { if (this.getAttributes().getLength() > 0 ) { return true;}
else { return false;}
}
}
catch (e) { return false;}
}
DOMNode.prototype._filterByAttributeValue = function(expr, containerNodeSet) { try { var nameStart = expr.indexOf("@") + 1; var equalsStart = expr.indexOf("="); var attributeName = expr.substr(nameStart, expr.indexOf("=", nameStart) - 1); var valueTesting = expr.substr(equalsStart + 1, expr.length); if (valueTesting.charAt(0) == "\"" || valueTesting.charAt(0) == "'") { valueTesting = valueTesting.substr(1, valueTesting.length);}
if (valueTesting.charAt(valueTesting.length - 1) == "\"" || valueTesting.charAt(valueTesting.length - 1) == "'") { valueTesting = valueTesting.substr(0, valueTesting.length -1);}
var attribute = this.getAttributes().getNamedItem(attributeName); if (attribute.getValue() == valueTesting) { return true;}
else { return false;}
}
catch (e) { return false
}
}
DOMNode.prototype._filterByAttribute = function(expr, containerNodeSet) { if (expr == "@*") { return this._filterByAttributeExistance(expr, containerNodeSet);}
if (expr.indexOf("=") < 0) { return this._filterByAttributeExistance(expr, containerNodeSet);}
return this._filterByAttributeValue(expr, containerNodeSet);}
DOMNode.prototype._filterByNot = function(expr, containerNodeSet) { expr = expr.substr(4, expr.length); var endNotLocation = this._findExpressionEnd(expr, "(", ")"); expr = expr.substr(0, endNotLocation); return !this._filter(expr, containerNodeSet);}
DOMNode.prototype._findExpressionEnd = function(expression, startCharacter, endCharacter) { var startCharacterNum = 0; var endExpressionLocation = 0; var intCount = expression.length; for (intLoop = 0; intLoop < intCount; intLoop++) { var character = expression.charAt(intLoop); switch(character) { case startCharacter:
startCharacterNum++; break; case endCharacter:
if (startCharacterNum == 0) { endExpressionLocation = intLoop;}
else { startCharacterNum--;}
break;}
if (endExpressionLocation != 0) { break;}
}
return endExpressionLocation;}
DOMNode.prototype._filterByLocation = function(expr, containerNodeSet) { var item = 0 + expr - 1; if (this == containerNodeSet.item(item)) { return true;}
else { return false;}
}
DOMNode.prototype._filterByLast = function(expr, containerNodeSet) { if (this == containerNodeSet.item(containerNodeSet.length -1)) { return true;}
else { return false;}
}
DOMNode.prototype._filterByCount = function(expr, containerNodeSet) { var countStart = expr.indexOf("=") + 1; var countStr = expr.substr(countStart, expr.length); var countInt = parseInt(countStr); expr = expr.substr(6, expr.length); expr = expr.substr(0, this._findExpressionEnd(expr, "(", ")")); if (expr == "*") { return false;}
var tmpNodeSet = this.selectNodeSet(expr); var tmpNodeSetLength = tmpNodeSet.length; if (tmpNodeSetLength == countInt) { return true;}
else { return false;}
}
DOMNode.prototype._filterByName = function(expr, containerNodeSet) { var equalLocation = expr.indexOf("="); var quoteChar = expr.charAt(equalLocation + 1); var name = ""; for (intLoop = equalLocation + 2; intLoop < expr.length; intLoop++) { if (expr.charAt(intLoop) == quoteChar) { break;}
else { name += expr.charAt(intLoop);}
}
if (this.getNodeName() == name) { return true;}
else { return false;}
}
DOMNode.prototype._filterByPosition = function(expr, containerNodeSet) { var equalsLocation = expr.indexOf("="); var tmpPos = expr.substr(equalsLocation + 1, expr.length); if (tmpPos.indexOf("last()") == 0) { if (this == containerNodeSet.item(containerNodeSet.length -1)) { return true;}
else { return false;}
}
var intCount = tmpPos.length; var positionStr = ""; for (intLoop = 0; intLoop < intCount; intLoop++) { if (isNaN(positionStr + tmpPos.charAt(intLoop)) == false) { positionStr+=tmpPos.charAt(intLoop);}
else { break;}
}
var positionInt = parseInt(positionStr) - 1; if (this == containerNodeSet.item(positionInt) ) { return true;}
else { return false;}
}
DOMNode.prototype._filter = function(expr, containerNodeSet) { expr = trim(expr, true, true); if (expr.indexOf("not(") == 0) { return this._filterByNot(expr, containerNodeSet);}
if (expr.indexOf("count(") == 0) { return this._filterByCount(expr, containerNodeSet);}
if (expr.indexOf("name(") == 0) { return this._filterByName(expr, containerNodeSet);}
if (expr.indexOf("position(") == 0) { return this._filterByPosition(expr, containerNodeSet);}
if (expr.indexOf("@") > -1 ) { return this._filterByAttribute(expr, containerNodeSet);}
if (isNaN(expr) == false) { return this._filterByLocation(expr, containerNodeSet);}
if (expr == "last()") { return this._filterByLast(expr, containerNodeSet);}
}
DOMNode.prototype._getAxis = function(axisConst) { if (axisConst == DOMNode.ANCESTOR_AXIS) return this._getAncestorAxis(); else if (axisConst == DOMNode.ANCESTOR_OR_SELF_AXIS) return this._getAncestorOrSelfAxis(); else if (axisConst == DOMNode.ATTRIBUTE_AXIS) return this._getAttributeAxis(); else if (axisConst == DOMNode.CHILD_AXIS) return this._getChildAxis(); else if (axisConst == DOMNode.DESCENDANT_AXIS) return this._getDescendantAxis(); else if (axisConst == DOMNode.DESCENDANT_OR_SELF_AXIS) return this._getDescendantOrSelfAxis(); else if (axisConst == DOMNode.FOLLOWING_AXIS) return this._getFollowingAxis(); else if (axisConst == DOMNode.FOLLOWING_SIBLING_AXIS) return this._getFollowingSiblingAxis(); else if (axisConst == DOMNode.NAMESPACE_AXIS) return this._getNamespaceAxis(); else if (axisConst == DOMNode.PARENT_AXIS) return this._getParentAxis(); else if (axisConst == DOMNode.PRECEDING_AXIS) return this._getPrecedingAxis(); else if (axisConst == DOMNode.PRECEDING_SIBLING_AXIS) return this._getPrecedingSiblingAxis(); else if (axisConst == DOMNode.SELF_AXIS) return this._getSelfAxis(); else if (axisConst == DOMNode.ROOT_AXIS) return this._getRootAxis(); else { alert('Error in DOMNode._getAxis: Attempted to get unknown axis type '+ axisConst); return null;}
}; DOMNode.prototype._getAncestorAxis = function() { var parentNode = this.parentNode; if (parentNode.nodeType != DOMNode.DOCUMENT_NODE ) { return this.parentNode._getAncestorOrSelfAxis();}
else { return new XPATHNodeSet(this.ownerDocument, this.parentNode, null);}
}; DOMNode.prototype._getAncestorOrSelfAxis = function() { return this._getSelfAxis().union(this._getAncestorAxis());}; DOMNode.prototype._getAttributeAxis = function() { return new XPATHNodeSet(this.ownerDocument, this.parentNode, this.attributes);}; DOMNode.prototype._getChildAxis = function() { return new XPATHNodeSet(this.ownerDocument, this.parentNode, this.childNodes);}; DOMNode.prototype._getDescendantAxis = function() { var descendantNodeSet = new XPATHNodeSet(this.ownerDocument, this.parentNode, null); for (var i=0; i < this.childNodes.length; i++) { descendantNodeSet.union(this.childNodes.item(i)._getDescendantOrSelfAxis());}
return descendantNodeSet;}; DOMNode.prototype._getReversedDescendantAxis = function() { var descendantNodeSet = new XPATHNodeSet(this.ownerDocument, this.parentNode, null); for (var i=this.childNodes.length -1; i >= 0; i--) { descendantNodeSet.union(this.childNodes.item(i)._getReversedDescendantOrSelfAxis());}
return descendantNodeSet;}; DOMNode.prototype._getDescendantOrSelfAxis = function() { return this._getSelfAxis().union(this._getDescendantAxis());}; DOMNode.prototype._getReversedDescendantOrSelfAxis = function() { return this._getSelfAxis().union(this._getReversedDescendantAxis());}; DOMNode.prototype._getFollowingAxis = function() { var followingNodeSet = new XPATHNodeSet(this.ownerDocument, this.parentNode, null); if (this.nextSibling) { followingNodeSet._appendChild(this.nextSibling); followingNodeSet.union(this.nextSibling._getDescendantAxis()); followingNodeSet.union(this.nextSibling._getFollowingAxis());}
return followingNodeSet;}; DOMNode.prototype._getFollowingSiblingAxis = function() { var followingSiblingNodeSet = new XPATHNodeSet(this.ownerDocument, this.parentNode, null); if (this.nextSibling) { followingSiblingNodeSet._appendChild(this.nextSibling); followingSiblingNodeSet.union(this.nextSibling._getFollowingSiblingAxis());}
return followingSiblingNodeSet;}; DOMNode.prototype._getParentAxis = function() { var parentNodeSet = new XPATHNodeSet(this.ownerDocument, this.parentNode, null); var parentNode = this.parentNode; if (parentNode) { parentNodeSet._appendChild(parentNode);}
return parentNodeSet;}; DOMNode.prototype._getPrecedingAxis = function() { var precedingNodeSet = new XPATHNodeSet(this.ownerDocument, this.parentNode, null); if (this.previousSibling) { precedingNodeSet.union(this.previousSibling._getReversedDescendantAxis()); precedingNodeSet._appendChild(this.previousSibling); precedingNodeSet.union(this.previousSibling._getPrecedingAxis());}
return precedingNodeSet;}; DOMNode.prototype._getPrecedingSiblingAxis = function() { var precedingSiblingNodeSet = new XPATHNodeSet(this.ownerDocument, this.parentNode, null); if (this.previousSibling) { precedingSiblingNodeSet._appendChild(this.previousSibling); precedingSiblingNodeSet.union(this.previousSibling._getPrecedingSiblingAxis());}
return precedingSiblingNodeSet;}; DOMNode.prototype._getSelfAxis = function() { var selfNodeSet = new XPATHNodeSet(this.ownerDocument, this.parentNode, null); selfNodeSet._appendChild(this); return selfNodeSet;}; DOMNode.prototype._getRootAxis = function() { var rootNodeSet = new XPATHNodeSet(this.ownerDocument, this.parentNode, null); rootNodeSet._appendChild(this.documentElement); return rootNodeSet;}; DOMNode.prototype.selectNodeSet = function (locationPath) { locationPath = locationPath.replace(/^\//g, 'root::')
var result; try { result = this.selectNodeSet_recursive(locationPath); return result;}
catch (e) { return null;}
}
DOMNode.prototype.selectNodeSet_recursive = function (locationPath) { var locationSteps = locationPath.split('/'); var candidateNodeSet; var resultNodeSet = new XPATHNodeSet(this.ownerDocument, this.parentNode); if (locationSteps.length > 0) { var stepStr = locationSteps[0]; locationSteps = __removeFirstArrayElement(locationSteps); var stepObj = this._parseStep(stepStr); var axisStr = stepObj.axis; var nodeTestStr = stepObj.nodeTest; var predicateListStr = stepObj.predicateList; var axisType = this._parseAxis(axisStr); var nodeTestObj = this._parseNodeTest(nodeTestStr); var nodeTestType = nodeTestObj.type; var nodeTestValue = nodeTestObj.value; candidateNodeSet = this._getAxis(axisType); if (nodeTestType == DOMNode.NODE_TYPE_TEST) { candidateNodeSet = candidateNodeSet.getTypedItems(nodeTestValue);}
else if (nodeTestType == DOMNode.NODE_NAME_TEST) { candidateNodeSet = candidateNodeSet.getNamedItems(nodeTestValue);}
var predicateList = this._parsePredicates(predicateListStr); for (predicate in predicateList) { candidateNodeSet = candidateNodeSet.filter(predicateList[predicate]);}
if (locationSteps.length > 0) { var remainingLocationPath = locationSteps.join('/'); candidateNodeSet = candidateNodeSet.selectNodeSet_recursive(remainingLocationPath);}
}
return candidateNodeSet;}; DOMNode.prototype._nodeTypeIs = function(node, type) { return (node.nodeType == type);}; DOMNode.prototype._nodeNameIs = function(node, name) { return (node.nodeName == name);}; DOMNode.prototype._parseStep = function(step) { var resultStep = new Object(); resultStep.axis = ""; var nodeTestStartInd = 0; var axisEndInd = step.indexOf('::'); if (axisEndInd > -1) { resultStep.axis = step.substring(0, axisEndInd); nodeTestStartInd = axisEndInd +2;}
resultStep.predicateList = ""; var predicateStartInd = step.indexOf('['); if (predicateStartInd > -1) { resultStep.predicateList = step.substring(predicateStartInd); resultStep.nodeTest = step.substring(nodeTestStartInd, predicateStartInd);}
else { resultStep.nodeTest = step.substring(nodeTestStartInd);}
if (resultStep.nodeTest.indexOf('@') == 0) { resultStep.axis = 'attribute'; resultStep.nodeTest = resultStep.nodeTest.substring(1);}
if (resultStep.nodeTest.length == 0) { resultStep.axis = 'descendant-or-self';}
if (resultStep.nodeTest == '..') { resultStep.axis = 'parent'; resultStep.nodeTest = 'node()';}
if (resultStep.nodeTest == '.') { resultStep.axis = 'self'; resultStep.nodeTest = 'node()';}
return resultStep;}; DOMNode.prototype._parseAxis = function(axisStr) { var returnAxisType = DOMNode.CHILD_AXIS; if (axisStr == 'ancestor') returnAxisType = DOMNode.ANCESTOR_AXIS; else if (axisStr == 'ancestor-or-self') returnAxisType = DOMNode.ANCESTOR_OR_SELF_AXIS; else if (axisStr == 'attribute') returnAxisType = DOMNode.ATTRIBUTE_AXIS; else if (axisStr == 'child') returnAxisType = DOMNode.CHILD_AXIS; else if (axisStr == 'descendant') returnAxisType = DOMNode.DESCENDANT_AXIS; else if (axisStr == 'descendant-or-self') returnAxisType = DOMNode.DESCENDANT_OR_SELF_AXIS; else if (axisStr == 'following') returnAxisType = DOMNode.FOLLOWING_AXIS; else if (axisStr == 'following-sibling') returnAxisType = DOMNode.FOLLOWING_SIBLING_AXIS; else if (axisStr == 'namespace') returnAxisType = DOMNode.NAMESPACE_AXIS; else if (axisStr == 'parent') returnAxisType = DOMNode.PARENT_AXIS; else if (axisStr == 'preceding') returnAxisType = DOMNode.PRECEDING_AXIS; else if (axisStr == 'preceding-sibling') returnAxisType = DOMNode.PRECEDING_SIBLING_AXIS; else if (axisStr == 'self') returnAxisType = DOMNode.SELF_AXIS
else if (axisStr == 'root') returnAxisType = DOMNode.ROOT_AXIS
return returnAxisType;}
DOMNode.prototype._parseNodeTest = function(nodeTestStr) { var returnNodeTestObj = new Object(); if (nodeTestStr.length == 0) { returnNodeTestObj.type = DOMNode.NODE_TYPE_TEST
returnNodeTestObj.value = 'node';}
else { var funInd = nodeTestStr.indexOf('('); if (funInd > -1) { returnNodeTestObj.type = DOMNode.NODE_TYPE_TEST
returnNodeTestObj.value = nodeTestStr.substring(0, funInd);}
else { returnNodeTestObj.type = DOMNode.NODE_NAME_TEST
returnNodeTestObj.value = nodeTestStr;}
}
return returnNodeTestObj;}; DOMNode.prototype._parsePredicates = function(predicateListStr) { var returnPredicateArray = new Array(); if (predicateListStr.length > 0) { var firstOpenBracket = predicateListStr.indexOf('['); var lastCloseBracket = predicateListStr.lastIndexOf(']'); predicateListStr = predicateListStr.substring(firstOpenBracket+1, lastCloseBracket); returnPredicateArray = predicateListStr.split('][');}
return returnPredicateArray;}
XPATHNodeSet = function(ownerDocument, parentNode, nodeList) { this.DOMNodeList = DOMNodeList; this.DOMNodeList(ownerDocument, parentNode); if (nodeList) { for (var i=0; i < nodeList.length; i++) { this._appendChild(nodeList.item(i));}
}
}; XPATHNodeSet.prototype = new DOMNodeList(); XPATHNodeSet.prototype.selectNodeSet_recursive = function(xpath) { var selectedNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { var candidateNode = this.item(i); selectedNodeSet.union(candidateNode.selectNodeSet_recursive(xpath));}
return selectedNodeSet;}; XPATHNodeSet.prototype.getNamedItems = function(nodeName) { var namedItemsNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { var candidateNode = this.item(i); if ((nodeName == '*') || (candidateNode.nodeName == nodeName)) { namedItemsNodeSet._appendChild(candidateNode);}
}
return namedItemsNodeSet;}; XPATHNodeSet.prototype.getTypedItems = function(nodeType) { var typedItemsNodeSet = new XPATHNodeSet(this.ownerDocument); var nodeTypeId; if (nodeType.toLowerCase() == "node") { nodeTypeId = 0;}
else if (nodeType.toLowerCase() == "text") { nodeTypeId = DOMNode.TEXT_NODE;}
else if (nodeType.toLowerCase() == "comment") { nodeTypeId = DOMNode.COMMENT_NODE;}
else if (nodeType.toLowerCase() == "processing-instruction") { nodeTypeId = DOMNode.PROCESSING_INSTRUCTION_NODE;}
for (var i=0; i < this.length; i++) { var candidateNode = this.item(i); if ((nodeTypeId == 0) || (candidateNode.nodeType == nodeTypeId)) { typedItemsNodeSet._appendChild(candidateNode);}
}
return typedItemsNodeSet;}; XPATHNodeSet.prototype._getAxis = function(axisConst) { if (axisConst == DOMNode.ANCESTOR_AXIS) return this._getAncestorAxis(); else if (axisConst == DOMNode.ANCESTOR_OR_SELF_AXIS) return this._getAncestorOrSelfAxis(); else if (axisConst == DOMNode.ATTRIBUTE_AXIS) return this._getAttributeAxis(); else if (axisConst == DOMNode.CHILD_AXIS) return this._getChildAxis(); else if (axisConst == DOMNode.DESCENDANT_AXIS) return this._getDescendantAxis(); else if (axisConst == DOMNode.DESCENDANT_OR_SELF_AXIS) return this._getDescendantOrSelfAxis(); else if (axisConst == DOMNode.FOLLOWING_AXIS) return this._getFollowingAxis(); else if (axisConst == DOMNode.FOLLOWING_SIBLING_AXIS) return this._getFollowingSiblingAxis(); else if (axisConst == DOMNode.NAMESPACE_AXIS) return this._getNamespaceAxis(); else if (axisConst == DOMNode.PARENT_AXIS) return this._getParentAxis(); else if (axisConst == DOMNode.PRECEDING_AXIS) return this._getPrecedingAxis(); else if (axisConst == DOMNode.PRECEDING_SIBLING_AXIS) return this._getPrecedingSiblingAxis(); else if (axisConst == DOMNode.SELF_AXIS) return this._getSelfAxis(); else if (axisConst == DOMNode.ROOT_AXIS) return this._getRootAxis(); else { alert('Error in XPATHNodeSet._getAxis: Attempted to get unknown axis type '+ axisConst); return null;}
}; XPATHNodeSet.prototype._getAncestorAxis = function() { var ancestorAxisNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { ancestorAxisNodeSet.union(this.item(i)._getDescendantAxis());}
}; XPATHNodeSet.prototype._getAncestorOrSelfAxis = function() { var ancestorOrSelfAxisNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { ancestorOrSelfAxisNodeSet.union(this.item(i)._getAncestorOrSelfAxis());}
}; XPATHNodeSet.prototype._getAttributeAxis = function() { var attributeAxisNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { attributeAxisNodeSet.union(this.item(i)._getAttributeAxis());}
}; XPATHNodeSet.prototype._getChildAxis = function() { var childNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { childNodeSet.union(this.item(i)._getChildAxis());}
}; XPATHNodeSet.prototype._getDescendantAxis = function() { var descendantNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { descendantNodeSet.union(this.item(i)._getDescendantAxis());}
}; XPATHNodeSet.prototype._getReversedDescendantAxis = function() { var descendantNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=this.length-1; i >= 0 ; i--) { descendantNodeSet.union(this.item(i)._getReversedDescendantAxis());}
}; XPATHNodeSet.prototype._getDescendantOrSelfAxis = function() { var descendantOrSelfNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { descendantOrSelfNodeSet.union(this.item(i)._getDescendantOrSelfAxis());}
}; XPATHNodeSet.prototype._getFollowingAxis = function() { var followingNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { followingNodeSet.union(this.item(i)._getFollowingAxis());}
}; XPATHNodeSet.prototype._getFollowingSiblingAxis = function() { var followingSibilingNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { followingSibilingNodeSet.union(this.item(i)._getFollowingSiblingAxis());}
}; XPATHNodeSet.prototype._getParentAxis = function() { var parentNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { parentNodeSet.union(this.item(i)._getParentAxis());}
}; XPATHNodeSet.prototype._getPrecedingAxis = function() { var precedingNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { precedingNodeSet.union(this.item(i)._getPrecedingAxis());}
}; XPATHNodeSet.prototype._getPrecedingSiblingAxis = function() { var precedingSiblingNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { precedingSiblingNodeSet.union(this.item(i)._getPrecedingSiblingAxis());}
}; XPATHNodeSet.prototype._getSelfAxis = function() { var selfNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { selfNodeSet.union(this.item(i)._getSelfAxis());}
}; XPATHNodeSet.prototype.union = function(nodeSet) { for (var i=0; i < nodeSet.length; i++) { this._appendChild(nodeSet.item(i));}
return this;}; XPATHNodeSet.prototype._getContainingNodeSet = function() { return this;}; XPATHNodeSet.prototype.getLength = function() { return this.length;}
XPATHNodeSet.prototype.filter = function(expressionStr) { var matchingNodeSet = new XPATHNodeSet(this.ownerDocument); for (var i=0; i < this.length; i++) { if (this.item(i)._filter(expressionStr, this)) { matchingNodeSet._appendChild(this.item(i));}
}
return matchingNodeSet;}; function __removeFirstArrayElement(oldArray) { var newArray = new Array(); try { for (intLoop = 1; intLoop < oldArray.length; intLoop++) { newArray[newArray.length] = oldArray[intLoop];}
}
catch (e) { }
return newArray;}
