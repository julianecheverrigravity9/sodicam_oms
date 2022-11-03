exports = async function(changeEvent){
  const { fullDocument } = changeEvent;
  const orderState = fullDocument.state;
  const capacityToCalculate = orderState === "In progress" ? -1 : orderState === "Delivered" ? 1 : 0;
  
  if(capacityToCalculate == 0){
    return;
  }
  
  const collection = context.services.get("mongodb-atlas").db("sodimac_oms").collection("nodes");
  const nodes = await collection.find(
    {
     "$and": [
       {"zone.neighborhoods" : {"$all": [fullDocument.address.neighborhood]}},
       {"delivery_capacity": {"$gt": 0}},
       {"zone.city": {"$eq": fullDocument.address.city}},
       {"zone.state": {"$eq": fullDocument.address.state}},
       {"zone.country": {"$eq": fullDocument.address.country}}
     ]   
    }
  ).toArray();
  
  if(!nodes || nodes.length <= 0){
    return;
  }
  
  // TODO: Retrieve proper node
  var node = nodes[0];
  var newCapacity = node.delivery_capacity + capacityToCalculate;
  var updatedResult = await collection.updateOne({_id: node._id}, {"$set": {"delivery_capacity": newCapacity}});
  
  console.log(JSON.stringify(updatedResult));
  
  if(updatedResult.modifiedCount > 0){
    console.log(`Capacity updated for node: ${node.name}, capacity: ${newCapacity}`);
  }
  
  return;
};