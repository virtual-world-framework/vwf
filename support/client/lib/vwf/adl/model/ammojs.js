"use strict";

// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

/// vwf/model/object.js is a backstop property store.
/// 
/// @module vwf/model/object
/// @requires vwf/model
/// @requires vwf/configuration

var SCENE = 0;
var SPHERE = 1;
var BOX = 2;
var CYLINDER = 3;
var CONE = 3;
var PLANE = 4;
var MESH = 5;
var NONE = 6;
var ASSET = 7;

function collectChildCollisions(node, list) {
    if (!list) list = [];
    for (var i in node.children) {
        collectChildCollisions(node.children[i], list);
    }
    if (node.enabled === true) {
        var col = node.buildCollisionShape();
        if (col) {
            list.push({
                matrix: vwf.getProperty(node.id, 'worldTransform'),
                collision: col,
                mass: node.mass,
                localScale: node.localScale,
                node: node

            });

            list[list.length - 1].matrix[0] /= node.localScale[0];
            list[list.length - 1].matrix[1] /= node.localScale[0];
            list[list.length - 1].matrix[2] /= node.localScale[0];

            list[list.length - 1].matrix[4] /= node.localScale[1];
            list[list.length - 1].matrix[5] /= node.localScale[1];
            list[list.length - 1].matrix[6] /= node.localScale[1];

            list[list.length - 1].matrix[8] /= node.localScale[2];
            list[list.length - 1].matrix[9] /= node.localScale[2];
            list[list.length - 1].matrix[10] /= node.localScale[2];

          
        }
    }
    return list;
}

function phyJoint(id,world,driver)
{
    this.id = id;
    this.world = world;
    this.bID = null;
    this.aID = null;
    this.bodyA = null;
    this.bodyB = null;
    this.initialized = false;
    this.ready = false;
    this.driver = driver;
}
phyJoint.prototype.destroy = function()
{
    if(this.ready)
    {
        this.world.removeConstraint(this.joint)
        this.joint = null;
        this.ready = false;    
    }
}
phyJoint.prototype.setBodyAID = function(nodeID)
{   
    this.aID = nodeID;
    this.destroy();
}
phyJoint.prototype.setBodyBID = function(nodeID)
{
    this.bID = nodeID;
    this.destroy();
}
phyJoint.prototype.setBodyA = function(body)
{   
    this.bodyA = body;
    this.destroy();
}
phyJoint.prototype.setBodyB = function(body)
{
    this.bodyB = body;
    this.destroy();
}
phyJoint.prototype.update = function()
{
    if(!this.ready)
    {
        this.initialize();
    }
}
phyJoint.prototype.initialize = function()
{
    if(this.driver)
    {
        //find your body in the driver
        if(this.aID)
        {
            if(this.driver.allNodes[this.aID] && this.driver.allNodes[this.aID].body)
            {
                this.setBodyA(this.driver.allNodes[this.aID].body);
            }
        }
        //find your body in the driver
        if(this.bID)
        {
            if(this.driver.allNodes[this.bID] && this.driver.allNodes[this.bID].body)
            {
                this.setBodyB(this.driver.allNodes[this.bID].body);
            }
        }
        if(this.bodyA && this.bodyB)
        {
            this.joint = this.buildJoint();
            this.world.addConstraint(this.joint);
            this.ready = true;
        }
    }
}

function phyPointToPointJoint(id,world,driver)
{
    this.pointA = null;
    this.pointB = null;
    phyJoint.call(this,id,world,driver);
}
phyPointToPointJoint.prototype = new phyJoint();

phyPointToPointJoint.prototype.buildJoint = function()
{
    this.pointA = [0,0,0];
    this.pointB = [0,0,0];
    var pa = new Ammo.btVector3(this.pointA[0],this.pointA[1],this.pointA[2]);
    var pb = new Ammo.btVector3(this.pointB[0],this.pointB[1],this.pointB[2]);
    return new Ammo.btPoint2PointConstraint(this.bodyA,this.bodyB,pa,pb);
}
function phyObject(id, world) {
    this.body = null;
    this.ready = false;
    this.mass = 1;
    this.collision = null;
    this.enabled = false;
    this.initialized = false;
    this.collisionDirty = false;
    this.id = id;
    this.restitution = 0;
    this.friction = 1;
    this.damping = .01;
    this.world = world;
    this.children = {};
    this.localOffset = null;
    this.collisionBodyOffsetPos = [0, 0, 0];
    this.collisionBodyOffsetRot = [1, 0, 0, 1];
    this.angularVelocity = [0, 0, 0];
    this.linearVelocity = [0, 0, 0];
    this.localScale = [1, 1, 1];
    this.activationState = 1;
    this.deactivationTime = 0;
    this.linearFactor = [1, 1, 1];
    this.angularFactor = [1, 1, 1];

}
phyObject.prototype.getWorldScale = function() {
    var parent = this;
    var localScale = [1, 1, 1];
    while (parent) {
        localScale[0] *= parent.localScale[0];
        localScale[1] *= parent.localScale[1];
        localScale[2] *= parent.localScale[2];
        parent = parent.parent;
    }
    return localScale;

}
phyObject.prototype.addForce = function(vec) {
    if (vec.length !== 3) return;
    if (this.initialized === true) {
        var f = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        this.body.applyForce(f);
        Ammo.destroy(f);

    }
}
phyObject.prototype.addTorque = function(vec) {
    if (vec.length !== 3) return;
    if (this.initialized === true) {
        var f = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        this.body.applyTorque(f);
        Ammo.destroy(f);

    }
}
phyObject.prototype.addForceImpulse = function(vec) {
    if (vec.length !== 3) return;
    if (this.initialized === true) {
        var f = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        this.body.applyImpulse(f);
        Ammo.destroy(f);

    }
}
phyObject.prototype.addTorqueImpulse = function(vec) {
    if (vec.length !== 3) return;
    if (this.initialized === true) {
        var f = new Ammo.btVector3(vec[0], vec[1], vec[2])
        this.body.applyTorqueImpulse(f);
        Ammo.destroy(f);

    }
}
phyObject.prototype.addForceOffset = function(vec, pos) {
    if (vec.length !== 3) return;
    if (pos.length !== 3) return;
    if (this.initialized === true) {
        var f = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        var g = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        this.body.applyForce(f, g);
        Ammo.destroy(f);
        Ammo.destroy(g);

    }
}
phyObject.prototype.setLinearFactor = function(vec) {
    if (vec.length !== 3) return;
    this.linearFactor = vec;
    if (this.initialized === true) {
        var f = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        this.body.setLinearFactor(f);
        Ammo.destroy(f);
    }
}
phyObject.prototype.getLinearFactor = function(vec) {
    return this.linearFactor;
}
phyObject.prototype.getAngularFactor = function(vec) {
    return this.linearFactor;
}
phyObject.prototype.setAngularFactor = function(vec) {
    if (vec.length !== 3) return;
    this.angularFactor = vec;
    if (this.initialized === true) {
        var f = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        this.body.setAngularFactor(f);
        Ammo.destroy(f);
    }
}
phyObject.prototype.setMass = function(mass) {
    this.mass = mass;
    if (this.initialized === true) {

        var localInertia = new Ammo.btVector3();
        this.collision.calculateLocalInertia(this.mass, localInertia);
        this.body.setMassProps(this.mass, localInertia);
        this.body.updateInertiaTensor();
        Ammo.destroy(localInertia);
        //todo: need to inform parents that mass has changed, might require recompute of center of mass for compound body
    }
}
phyObject.prototype.initialize = function() {

    this.ready = true;
    //currently, only objects which are children of the world can be bodies
    if (this.enabled && this.parent.id == vwf.application() && this.initialized === false) {
        this.initialized = true;
        console.log('init', this.id);
        var childCollisions = collectChildCollisions(this);
        this.localOffset = null;
        //this object has no child physics objects, so just use it's normal collision shape
        //  if(childCollisions.length == 1)
        //      this.collision = this.buildCollisionShape();
        //  else
        {
            //so, since we have child collision objects, we need to create a compound collision
            this.collision = new Ammo.btCompoundShape();
            this.collision.vwfID = this.id;
            var x = 0;
            var y = 0;
            var z = 0;
            for (var i = 0; i < childCollisions.length; i++) {
                //note!! at this point, this object must be a child of the scene, so transform === worldtransform
                var thisworldmatrix = vwf.getProperty(this.id, 'transform');
                var wmi = [];
                Mat4.invert(thisworldmatrix, wmi);
                var aslocal = Mat4.multMat(wmi, childCollisions[i].matrix, []);
                childCollisions[i].local = aslocal;
                //take into account that the collision body may be offset from the object center.
                //this is true with assets, but not with prims
                aslocal[12] *= this.localScale[0];
                aslocal[13] *= this.localScale[1];
                aslocal[14] *= this.localScale[2];
                x += aslocal[12] + this.collisionBodyOffsetPos[0];
                y += aslocal[13] + this.collisionBodyOffsetPos[1];
                z += aslocal[14] + this.collisionBodyOffsetPos[2];
            }
            x /= childCollisions.length;
            y /= childCollisions.length;
            z /= childCollisions.length;

            //todo = using geometric center of collision body - should use weighted average considering mass of child
            for (var i = 0; i < childCollisions.length; i++) {
                var aslocal = childCollisions[i].local;
                var startTransform = new Ammo.btTransform();
                startTransform.getOrigin().setX(aslocal[12] - x);
                startTransform.getOrigin().setY(aslocal[13] - y);
                startTransform.getOrigin().setZ(aslocal[14] - z);

                var quat = [];
                Quaternion.fromRotationMatrix4(aslocal, quat);
                quat = Quaternion.normalize(quat, []);
                var q = new Ammo.btQuaternion(quat[0], quat[1], quat[2], quat[3]);
                startTransform.setRotation(q);

                //careful not to set the childcollision scale when the child is actually this - otherwise we'd be setting it twice, once on the 
                //collision body and once on the compound body
                //if(childCollisions[i].node !== this)
                //    childCollisions[i].collision.setLocalScaling(new Ammo.btVector3(childCollisions[i].localScale[0], childCollisions[i].localScale[1], childCollisions[i].localScale[2]));

                this.collision.addChildShape(startTransform, childCollisions[i].collision);

            }
            //NANs can result from divide by zero. Be sure to use 0 instead of nan
            this.localOffset = [x || 0, y || 0, z || 0];

        }

        this.startTransform = new Ammo.btTransform();
        this.startTransform.setIdentity();

        var isDynamic = (this.mass != 0);



        var localInertia = new Ammo.btVector3(0, 0, 0);
        if (isDynamic)
            this.collision.calculateLocalInertia(this.mass, localInertia);
        // Ammo.destroy(localInertia);
        //localoffset is used to offset the center of mass from the pivot point of the parent object
        if (this.localOffset) {
            var f = new Ammo.btVector3(this.localOffset[0] * this.localScale[0], this.localOffset[1] * this.localScale[1], this.localOffset[2] * this.localScale[2]);
            this.startTransform.setOrigin(f);
            // Ammo.destroy(f);
        } else {
            var f = new Ammo.btVector3(0, 0, 0);
            this.startTransform.setOrigin(f);
            // Ammo.destroy(f);
        }

        var myMotionState = new Ammo.btDefaultMotionState(this.startTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, myMotionState, this.collision, localInertia);
        this.body = new Ammo.btRigidBody(rbInfo);


        this.body.setDamping(this.damping, this.damping);
        this.body.setFriction(this.friction);
        this.body.setRestitution(this.restitution);

        var f = new Ammo.btVector3(this.linearVelocity[0], this.linearVelocity[1], this.linearVelocity[2]);
        this.body.setLinearVelocity(f);
        Ammo.destroy(f);
        var f = new Ammo.btVector3(this.angularVelocity[0], this.angularVelocity[1], this.angularVelocity[2]);
        this.body.setAngularVelocity(f);
        Ammo.destroy(f);
        var f = new Ammo.btVector3(this.angularFactor[0], this.angularFactor[1], this.angularFactor[2])
        this.body.setAngularFactor(f);
        Ammo.destroy(f);
        var f = new Ammo.btVector3(this.linearFactor[0], this.linearFactor[1], this.linearFactor[2]);
        this.body.setLinearFactor(f);
        Ammo.destroy(f);
        this.body.forceActivationState(this.activationState);
        this.body.setDeactivationTime(this.deactivationTime);
        var mat = vwf.getProperty(this.id, 'transform');
        if (mat)
            this.setTransform(mat);
        //we must return through the kernel here so it knows that this is revelant to all instances of this node
        //not just the proto



        this.world.addRigidBody(this.body);
        //so....... is this not handled by the cache and then set of properties that come in before initialize?
        vwf.setProperty(this.id, '___physics_activation_state', this.activationState);
        vwf.setProperty(this.id, '___physics_deactivation_time', this.deactivationTime);
        vwf.setProperty(this.id, '___physics_linear_velocity', this.linearVelocity);
        vwf.setProperty(this.id, '___physics_angular_velocity', this.angularVelocity);
    }
}
phyObject.prototype.deinitialize = function() {
    if (this.initialized === true) {
        this.initialized = false;
        this.world.removeRigidBody(this.body);
        Ammo.destroy(this.body);
        Ammo.destroy(this.collision);
        Ammo.destroy(this.startTransform);
        this.body = null;
        this.collision = null;
        this.startTransform = null;
    }
}
phyObject.prototype.getLinearVelocity = function() {
    if (this.initialized === true) {
        var vec = this.body.getLinearVelocity()
        this.linearVelocity = [vec.x(), vec.y(), vec.z()];
        return [vec.x(), vec.y(), vec.z()];
    } else
        return this.linearVelocity;
}
phyObject.prototype.setLinearVelocity = function(vel) {
    this.linearVelocity = vel;
    if (this.initialized === true) {
        var f = new Ammo.btVector3(vel[0], vel[1], vel[2]);
        this.body.setLinearVelocity();
        Ammo.destroy(f);
    }
}
phyObject.prototype.setAngularVelocity = function(vel) {
    this.angularVelocity = vel;
    if (this.initialized === true) {
        var f = new Ammo.btVector3(vel[0], vel[1], vel[2]);
        this.body.setAngularVelocity(f);
        Ammo.destroy(f);
    }
}

//note - we don't store up forces when the body is not initialized
//maybe we should? Not sure that forces are stateful
phyObject.prototype.getForce = function() {
    if (this.initialized === true) {
        var force = this.body.getTotalForce();
        return [force.x(), force.y(), force.z()];
    }
}
phyObject.prototype.setForce = function(force) {
    if (this.initialized === true) {
        var f = new btVector3(force[0], force[1], force[2]);
        this.body.setTotalForce(f);
        Ammo.destroy(f);
    }
}
phyObject.prototype.getTorque = function() {
    if (this.initialized === true) {
        var torque = this.body.getTotalTorque();
        return [torque.x(), torque.y(), torque.z()];
    }
}
phyObject.prototype.setTorque = function(torque) {
    if (this.initialized === true) {
        var f = new btVector3(torque[0], torque[1], torque[2]);
        this.body.setTotalTorque(f);
        Ammo.destroy(f);
    }
}


phyObject.prototype.getAngularVelocity = function() {
    //waiting for an ammo build that includes body.getAngularVelocity
    if (this.initialized === true) {
        var vec = this.body.getAngularVelocity()
        this.angularVelocity = [vec.x(), vec.y(), vec.z()];
        return [vec.x(), vec.y(), vec.z()];
    } else
        return this.angularVelocity;
}
phyObject.prototype.setRestitution = function(bounce) {
    this.restitution = bounce;
    if (this.initialized === true) {
        this.body.setRestitution(this.restitution);
    }
}
phyObject.prototype.setDamping = function(damping) {
    this.damping = damping;
    if (this.initialized === true) {
        this.body.setDamping(this.damping, this.damping);

    }
}
phyObject.prototype.setFriction = function(friction) {
    this.friction = friction;
    if (this.initialized === true) {
        this.body.setFriction(this.friction);

    }
}
phyObject.prototype.enable = function() {
    this.enabled = true;
    if (this.parent.id !== vwf.application()) {
        this.markRootBodyCollisionDirty();
    }
    //must do this on next tick. Does that mean initialized is stateful and needs to be in a VWF property?
    if (this.initialized === false) {
        // this.initialize();
    }
}

//must be very careful with data the the physics engine changes during the sim
//can't return cached values if body is enabled because we'll refelct the data 
//from the JS engine and not the changed state of the physics

phyObject.prototype.getActivationState = function() {

    if (this.initialized === true) {
        this.activationState = this.body.getActivationState();
        return this.body.getActivationState();
    } else
        return this.activationState;
}
phyObject.prototype.setActivationState = function(state) {

    state = Number(state);
    if (this.initialized === true) {
        this.body.setActivationState(state);
        this.body.forceActivationState(state);
        this.activationState = state
    } else
        this.activationState = state;
}
phyObject.prototype.getDeactivationTime = function() {

    if (this.initialized === true) {
        this.deactivationTime = this.body.getDeactivationTime();
        return this.body.getDeactivationTime();
    } else
        return this.deactivationTime;
}
phyObject.prototype.setDeactivationTime = function(time) {

    if (this.initialized === true) {
        this.body.setDeactivationTime(time);
        console.log("deactivationTime", time);
        this.deactivationTime = time;
    } else
        this.deactivationTime = time;
}

phyObject.prototype.disable = function() {
    this.enabled = false;
    if (this.parent.id !== vwf.application()) {
        this.markRootBodyCollisionDirty();
    }
    if (this.initialized === true) {
        this.deinitialize();
    }
}

var tempvec1 = [0, 0, 0];
var tempvec2 = [0, 0, 0];
var tempvec3 = [0, 0, 0];
var tempquat1 = [0, 0, 0, 0];
var tempquat2 = [0, 0, 0, 0];
var tempquat3 = [0, 0, 0, 0];
var tempmat1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var tempmat2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var tempmat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function vecset(newv, old) {
    for (var i = 0; i < old.length; i++)
        newv[i] = old[i];
    return newv;
}

phyObject.prototype.getTransform = function(outmat) {

    if (!outmat)
        outmat = [];
    var transform = this.body.getWorldTransform();
    var o = transform.getOrigin();
    var rot = transform.getRotation();
    var pos = tempvec1;
    pos[0] = o.x();
    pos[1] = o.y();
    pos[2] = o.z();

    var quat = tempquat1;
    quat[0] = rot.x();
    quat[1] = rot.y();
    quat[2] = rot.z();
    quat[3] = rot.w();

    quat = Quaternion.normalize(quat, tempquat2);
    var mat = goog.vec.Quaternion.toRotationMatrix4(quat, tempmat1);

    mat[0] *= this.localScale[0];
    mat[1] *= this.localScale[0];
    mat[2] *= this.localScale[0];

    mat[4] *= this.localScale[1];
    mat[5] *= this.localScale[1];
    mat[6] *= this.localScale[1];

    mat[8] *= this.localScale[2];
    mat[9] *= this.localScale[2];
    mat[10] *= this.localScale[2];

    var worldoffset = goog.vec.Mat4.multVec3(mat, this.localOffset, tempmat2)
    mat[12] = pos[0] - worldoffset[0] / this.localScale[0];
    mat[13] = pos[1] - worldoffset[1] / this.localScale[1];
    mat[14] = pos[2] - worldoffset[2] / this.localScale[2];


    //since the value is orthonormal, scaling is easy.

    this.transform = vecset(this.transform, mat);
    outmat = vecset(outmat, mat);
    return outmat;
}

function ScaleFromMatrix(mat) {
    var x = [mat[0], mat[1], mat[2]];
    var y = [mat[4], mat[5], mat[9]];
    var z = [mat[8], mat[9], mat[10]];

    return [MATH.lengthVec3(x), MATH.lengthVec3(y), MATH.lengthVec3(z)];

}

phyObject.prototype.setTransform = function(matrix) {
    matrix = Mat4.clone(matrix);
    this.transform = matrix;
    var oldScale = vecset([], this.localScale);
    this.localScale = ScaleFromMatrix(matrix);
    if (this.initialized === true) {

        this.lastTickRotation = null;
        this.thisTickRotation = null;

        matrix[0] /= this.localScale[0];
        matrix[1] /= this.localScale[0];
        matrix[2] /= this.localScale[0];

        matrix[4] /= this.localScale[1];
        matrix[5] /= this.localScale[1];
        matrix[6] /= this.localScale[1];

        matrix[8] /= this.localScale[2];
        matrix[9] /= this.localScale[2];
        matrix[10] /= this.localScale[2];

        var startTransform = new Ammo.btTransform();
        startTransform.getOrigin().setX(matrix[12]);
        startTransform.getOrigin().setY(matrix[13]);
        startTransform.getOrigin().setZ(matrix[14]);



        var quat = [];
        Quaternion.fromRotationMatrix4(matrix, quat);
        quat = Quaternion.normalize(quat, []);

        if (this.localOffset) {
            var worldoff = Mat4.multVec3(Quaternion.toRotationMatrix4(quat, []), this.localOffset, []);
            startTransform.getOrigin().setX(matrix[12] + worldoff[0]);
            startTransform.getOrigin().setY(matrix[13] + worldoff[1]);
            startTransform.getOrigin().setZ(matrix[14] + worldoff[2]);
        }

        var q = new Ammo.btQuaternion(quat[0], quat[1], quat[2], quat[3]);
        startTransform.setRotation(q);
        Ammo.destroy(q);

        this.body.setCenterOfMassTransform(startTransform);
        if (this.collision) {
            //update the localscaling

        }
        if (this.mass == 0) {

        }
    }
    //todo: the compound collision of the parent does not need to be rebuild, just transforms updated
    //need new flag for this instead of full rebuild
    if (this.enabled === true && this.parent.id !== vwf.application() || MATH.distanceVec3(this.localScale, oldScale) > .0001) {
        this.markRootBodyCollisionDirty();
    }


}
phyObject.delete = function(world) {
    this.deinitialize();
}
phyObject.prototype.markRootBodyCollisionDirty = function() {
    var parent = this;
    while (parent && parent.parent instanceof phyObject) {
        parent = parent.parent;
    }
    if (parent && parent instanceof phyObject) {
        parent.collisionDirty = true;
    }
}
phyObject.prototype.update = function() {

    if (this.enabled === true && this.initialized === false) {
        //ahhhhhhhh almost missed this. we were loosing some state in the cached properties! They were never re-set after a re-initialize
        this.initialize();

    }

    if (this.collisionDirty && this.initialized === true) {
        var backupTrans = this.getTransform();
        this.deinitialize();
        this.initialize();
        //this.setLocalScaling(backupTrans);
        this.collisionDirty = false;
    }
}

function phySphere(id, world) {

    this.radius = 1;
    this.world = world;
    this.id = id;
    this.type = SPHERE;
    this.children = {};
}
phySphere.prototype = new phyObject();
phySphere.prototype.buildCollisionShape = function() {
    return new Ammo.btSphereShape(this.radius * this.getWorldScale()[0]);
}

phySphere.prototype.setRadius = function(radius) {
    this.radius = radius;
    if (this.enabled === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

function phyBox(id, world) {

    this.length = .5;
    this.width = .5;
    this.height = .5;
    this.world = world;
    this.id = id;
    this.type = BOX;
    this.children = {};
}
phyBox.prototype = new phyObject();
phyBox.prototype.buildCollisionShape = function() {
    var f = new Ammo.btVector3(this.length * this.getWorldScale()[0], this.width * this.getWorldScale()[1], this.height * this.getWorldScale()[2]);
    return new Ammo.btBoxShape(f);

}

phyBox.prototype.setLength = function(length) {
    this.length = length / 2;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

phyBox.prototype.setWidth = function(width) {
    this.width = width / 2;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

phyBox.prototype.setHeight = function(height) {
    this.height = height / 2;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

function phyCylinder(id, world) {

    this.radius = 1;
    this.height = .5;
    this.world = world;
    this.id = id;
    this.type = CYLINDER;
    this.children = {};
}
phyCylinder.prototype = new phyObject();
phyCylinder.prototype.buildCollisionShape = function() {
    return new Ammo.btCylinderShapeZ(new Ammo.btVector3(this.radius * this.getWorldScale()[0], this.height * this.getWorldScale()[1], this.height * this.getWorldScale()[2]));
}

phyCylinder.prototype.setRadius = function(radius) {
    this.radius = radius;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

phyCylinder.prototype.setHeight = function(height) {
    this.height = height / 2;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

function phyCone(id, world) {

    this.radius = 1;
    this.height = 1;
    this.world = world;
    this.id = id;
    this.type = CONE;
    this.children = {};
}
phyCone.prototype = new phyObject();
phyCone.prototype.buildCollisionShape = function() {
    return new Ammo.btConeShapeZ(this.radius * this.getWorldScale()[0], this.height * this.getWorldScale()[1]);
}

phyCone.prototype.setRadius = function(radius) {
    this.radius = radius;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

phyCone.prototype.setHeight = function(height) {
    this.height = height;
    if (this.initialized === true) {
        this.collisionDirty = true;
    }
}

function phyPlane(id, world) {

    this.length = .5;
    this.width = .5;
    this.world = world;
    this.id = id;
    this.type = PLANE;
    this.children = {};
}
phyPlane.prototype = new phyObject();
phyPlane.prototype.buildCollisionShape = function() {
    return new Ammo.btBoxShape(new Ammo.btVector3(this.length * this.getWorldScale()[0], this.width * this.getWorldScale()[1], .001));
}

phyPlane.prototype.setLength = function(length) {
    this.length = length / 2;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

phyPlane.prototype.setWidth = function(width) {
    this.width = width / 2;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

//assets can be any type of collision, including trimesh
function phyAsset(id, world) {

    this.length = .5;
    this.width = .5;
    this.height = .5;
    this.radius = .5;
    this.type = ASSET;
    this.colType = NONE;
    this.world = world;
    this.id = id;

    this.children = {};
}
phyAsset.prototype = new phyObject();
phyAsset.prototype.setMass = function(mass) {
    if (!this.colType !== MESH)
        phyObject.prototype.setMass.call(this, mass);
    else
        phyObject.prototype.setMass.call(this, 0);
}

//because a mesh may have geometry offset from the center, we must build a compound shape with an offset
phyAsset.prototype.buildCollisionShape = function() {
    var compound = new Ammo.btCompoundShape();
    var transform = new Ammo.btTransform();
    transform.setIdentity();

    transform.getOrigin().setX(this.collisionBodyOffsetPos[0]);
    transform.getOrigin().setY(this.collisionBodyOffsetPos[1]);
    transform.getOrigin().setZ(this.collisionBodyOffsetPos[2]);

    //var q = new Ammo.btQuaternion(this.collisionBodyOffsetRot[0], this.collisionBodyOffsetRot[1], this.collisionBodyOffsetRot[2], this.collisionBodyOffsetRot[3]);
    //transform.setRotation(q);

    var col = this.buildCollisionShapeInner();
    if (col) {
        compound.addChildShape(transform, col);
        compound.setLocalScaling(new Ammo.btVector3(this.getWorldScale()[0], this.getWorldScale()[1], this.getWorldScale()[2]));
        return compound;
    }
    return null;
}
phyAsset.prototype.buildCollisionShapeInner = function() {
    if (this.colType == PLANE)
        return new Ammo.btBoxShape(new Ammo.btVector3(this.length * this.getWorldScale()[0], this.width * this.getWorldScale()[1], .001));
    if (this.colType == CONE)
        return new Ammo.btConeShapeZ(this.radius * this.getWorldScale()[0], this.height * this.getWorldScale()[1]);
    if (this.colType == CYLINDER)
        return new Ammo.btCylinderShapeZ(new Ammo.btVector3(this.radius * this.getWorldScale()[0], this.height * this.getWorldScale()[1], this.height * this.getWorldScale()[1]));
    if (this.colType == SPHERE)
        return new Ammo.btSphereShape(this.radius * this.getWorldScale()[0]);
    if (this.colType == BOX)
        return new Ammo.btBoxShape(new Ammo.btVector3(this.length * this.getWorldScale()[0], this.width * this.getWorldScale()[1], this.height * this.getWorldScale()[2]));
    if (this.colType == MESH) {
        return this.buildMeshCollision();
        //here be dragons
    }
}

phyAsset.prototype.setLength = function(length) {
    this.length = length / 2;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

phyAsset.prototype.setWidth = function(width) {
    this.width = width / 2;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

phyAsset.prototype.setHeight = function(height) {
    this.height = height / 2;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}
phyAsset.prototype.setRadius = function(radius) {
    this.radius = radius;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}
phyAsset.prototype.buildMeshCollision = function() {
    var threejsNode = _Editor.findviewnode(this.id);
    //so, we are going to find all child meshes, and find the matrix that puts their geometry into the coordspace of this node
    //NOTE: deal here with children? Might not want to collect children that are part of different VWF node?
    var list = [];
    threejsNode.updateMatrixWorld(true)
    var selfmat = threejsNode.matrixWorld.clone();
    var selfI = new THREE.Matrix4();
    selfI.getInverse(selfmat);
    var walk = function(tn) {
        for (var i = 0; i < tn.children.length; i++)
            walk(tn.children[i]);
        if (tn instanceof THREE.Mesh) {
            var lmat = tn.matrixWorld.clone();
            lmat = (new THREE.Matrix4()).multiplyMatrices(selfI, lmat);
            list.push({
                mat: lmat,
                mesh: tn
            })
        }
    }
    walk(threejsNode);
    var triangle_mesh = new Ammo.btTriangleMesh();
    // well, this seems right, but I can't find where the collision body actually ended up
    for (var i in list) {
        if (list[i].mesh.geometry && list[i].mesh.geometry instanceof THREE.Geometry) {
            for (var j = 0; j < list[i].mesh.geometry.faces.length; j++) {
                var face = list[i].mesh.geometry.faces[j];
                var v1 = list[i].mesh.geometry.vertices[face.a];
                var v2 = list[i].mesh.geometry.vertices[face.b];
                var v3 = list[i].mesh.geometry.vertices[face.c];

                v1 = v1.clone().applyMatrix4(list[i].mat);
                v2 = v2.clone().applyMatrix4(list[i].mat);
                v3 = v3.clone().applyMatrix4(list[i].mat);
                triangle_mesh.addTriangle(new Ammo.btVector3(v1.x, v1.y, v1.z), new Ammo.btVector3(v2.x, v2.y, v2.z), new Ammo.btVector3(v3.x, v3.y, v3.z), false);
            }

        }

    }
    var shape = new Ammo.btBvhTriangleMeshShape(
        triangle_mesh,
        true,
        true
    );

    //Cool, not list contains all the meshes
    return shape;


}
phyAsset.prototype.setType = function(type) {
    this.colType = type;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
    //meshes account for offsets
    //might have to think about how to center up center of mass
    if (this.colType == MESH) {
        //careful not to confuse VWF by modifying internal state but not informing kernel
        this.backup_collisionBodyOffsetPos = this.collisionBodyOffsetPos;
        this.collisionBodyOffsetPos = [0, 0, 0];

    } else {
        if (this.backup_collisionBodyOffsetPos) {
            this.collisionBodyOffsetPos = this.backup_collisionBodyOffsetPos;
            delete this.backup_collisionBodyOffsetPos;
        }
    }
}
//only assets have interface to move collision body away from mesh center point
//prims are centered properly or account for it themselves
phyAsset.prototype.setCollisionOffset = function(vec) {

    //meshes account for offsets
    //might have to think about how to center up center of mass
    if (this.type == MESH)
        return;

    this.collisionBodyOffsetPos = vec;
    if (this.initialized === true) {
        this.collisionDirty = true;
        this.markRootBodyCollisionDirty();
    }
}

define(["module", "vwf/model", "vwf/configuration"], function(module, model, configuration) {


    return model.load(module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        reEntry: false,
        initialize: function() {
            this.nodes = {};
            this.allNodes = {};
            this.bodiesToID = {};

            var self = this;
            window.findphysicsnode = function(id) {
                return self.allNodes[id];
            };
            window._PhysicsDriver = this;


            //patch ammo.js to include a get for activation state


            Ammo.btCompoundShape.prototype.addChildShapeInner = Ammo.btCompoundShape.prototype.addChildShape;

            Ammo.btCompoundShape.prototype.addChildShape = function(transform, shape) {
                if (!this.childShapes) {
                    this.childShapes = [];
                    this.childTransforms = [];
                }
                this.childShapes.push(shape);
                this.childTransforms.push(transform);
                this.addChildShapeInner(transform, shape);
            }
            Ammo.btCompoundShape.prototype.getChildShape = function(i) {
                if (!this.childShapes) {
                    this.childShapes = [];
                    this.childTransforms = [];
                }
                return this.childShapes[i];
            }
            Ammo.btCompoundShape.prototype.getChildTransforms = function(i) {
                if (!this.childShapes) {
                    this.childShapes = [];
                    this.childTransforms = [];
                }
                return this.childTransforms[i];
            }
            Ammo.btCompoundShape.prototype.getChildShapeCount = function() {
                if (!this.childShapes) {
                    this.childShapes = [];
                    this.childTransforms = [];
                }
                return this.childTransforms.length;
            }
        },
        testConstraint: function(id,id1,id2)
        {
            this.allNodes[id] = new phyPointToPointJoint(id,this.allNodes[vwf.application()].world,this);
            this.allNodes[id].setBodyAID(id1);
            this.allNodes[id].setBodyBID(id2);

        },
        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function(nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {
            if (childID === vwf.application()) {



                this.nodes[vwf.application()] = {
                    world: null,
                    type: SCENE,
                    initialized: false,
                    children: {},
                    id: childID,
                    simulationSteps: 10,
                    active: true,
                    ground: null,
                    localScale: [1, 1, 1]
                }

                this.allNodes[vwf.application()] = this.nodes[vwf.application()];
                this.resetWorld();
            }

            //node ID 
            //the parent does not exist, so.....
            if (!this.allNodes[nodeID]) return;

            if (nodeID && hasPrototype(childID, 'sphere2-vwf')) {
                this.allNodes[nodeID].children[childID] = new phySphere(childID, this.allNodes[vwf.application()].world);
            }
            if (nodeID && hasPrototype(childID, 'box2-vwf')) {
                this.allNodes[nodeID].children[childID] = new phyBox(childID, this.allNodes[vwf.application()].world);
            }
            if (nodeID && hasPrototype(childID, 'cylinder2-vwf')) {
                this.allNodes[nodeID].children[childID] = new phyCylinder(childID, this.allNodes[vwf.application()].world);
            }
            if (nodeID && hasPrototype(childID, 'cone2-vwf')) {
                this.allNodes[nodeID].children[childID] = new phyCone(childID, this.allNodes[vwf.application()].world);
            }
            if (nodeID && hasPrototype(childID, 'plane2-vwf')) {
                this.allNodes[nodeID].children[childID] = new phyPlane(childID, this.allNodes[vwf.application()].world);
            }


            if (nodeID && (hasPrototype(childID, 'asset-vwf') || hasPrototype(childID, 'sandboxGroup-vwf'))) {
                this.allNodes[nodeID].children[childID] = new phyAsset(childID, this.allNodes[vwf.application()].world);
            }
            //child was created
            if (this.allNodes[nodeID] && this.allNodes[nodeID].children[childID]) {
                this.allNodes[childID] = this.allNodes[nodeID].children[childID];
                this.allNodes[childID].parent = this.allNodes[nodeID];

                //mark some initial properties
                vwf.setProperty(childID, '___physics_activation_state', 1);
                vwf.setProperty(childID, '___physics_deactivation_time', 0);
                vwf.setProperty(childID, '___physics_velocity_linear', [0, 0, 0]);
                vwf.setProperty(childID, '___physics_velocity_angular', [0, 0, 0]);
            }

        },

        triggerCollisions: function() {
            var i, offset,
                dp = this.nodes[vwf.application()].world.getDispatcher(),
                num = dp.getNumManifolds(),
                manifold, num_contacts, j, pt,
                _collided = false;



            for (i = 0; i < num; i++) {
                manifold = dp.getManifoldByIndexInternal(i);
                num_contacts = manifold.getNumContacts();
                if (num_contacts === 0) {
                    continue;
                }

                for (j = 0; j < num_contacts; j++) {
                    pt = manifold.getContactPoint(j);
                    //if ( pt.getDistance() < 0 ) {

                    var body0 = manifold.getBody0();
                    var body1 = manifold.getBody1();
                    var vwfIDA = this.bodiesToID[body0.ptr];
                    var vwfIDB = this.bodiesToID[body1.ptr];

                    var _vector0 = pt.get_m_normalWorldOnB();
                    var pt2a = pt.getPositionWorldOnA();
                    var pt2b = pt.getPositionWorldOnB();
                    var collisionPointA = [pt2a.x(), pt2a.y(), pt2a.y()];
                    var collisionPointB = [pt2b.x(), pt2b.z(), pt2b.z()];
                    var collisionNormal = [_vector0.x(), _vector0.y(), _vector0.z()]

                    var collision = {
                        collisionPointA: collisionPointA,
                        collisionPointB: collisionPointB,
                        collisionNormal: collisionNormal
                    };
                    vwf.callMethod(vwfIDA, 'collision', [vwfIDB, collision]);
                    vwf.callMethod(vwfIDB, 'collision', [vwfIDA, collision]);
                    break;
                }
            }



        },
        ticking: function() {
            if (this.nodes[vwf.application()] && this.nodes[vwf.application()].active === true) {

                for (var i in this.allNodes) {
                    var node = this.allNodes[i];
                    if (node && node.update) {
                        node.update();


                        for (var i in node.delayedProperties) {
                            this.settingProperty(node.id, i, node.delayedProperties[i]);
                        }
                        delete node.delayedProperties;
                        if (node.body)
                            this.bodiesToID[node.body.ptr] = node.id;

                    }

                }
                //step 50ms per tick.
                //this is dictated by the input from the reflector
                this.nodes[vwf.application()].world.stepSimulation(1 / 20, 1, 1 / 20);
                this.reEntry = true;
                var tempmat = [];
                for (var i in this.allNodes) {
                    var node = this.allNodes[i];
                    if (node.body && node.initialized === true && node.mass > 0 && node.getActivationState() != 2) {

                        vwf.setProperty(node.id, 'transform', node.getTransform(tempmat));
                        //so, we were setting these here in order to inform the kernel that the property changed. Can we not do this, and 
                        //rely on the getter? that would be great....
                        vwf.setProperty(node.id, '___physics_activation_state', node.getActivationState());
                        vwf.setProperty(node.id, '___physics_velocity_angular', node.getAngularVelocity());
                        vwf.setProperty(node.id, '___physics_velocity_linear', node.getLinearVelocity());
                        vwf.setProperty(node.id, '___physics_deactivation_time', node.getDeactivationTime());

                    }
                }
                this.triggerCollisions();
                this.reEntry = false;
            } else {

            }
        },
        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function(nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName) {

            if (!this.allNodes[nodeID]) return;

            var node = this.allNodes[nodeID].children[childID];
            if (node)
                node.ready = true;
            if (node && node.initialized === false) {

                node.initialize(this.nodes[vwf.application()].world);
                for (var i in node.delayedProperties) {
                    this.settingProperty(node.id, i, node.delayedProperties[i]);
                }
                delete node.delayedProperties;
                if (node.body)
                    this.bodiesToID[node.body.ptr] = childID;
            }

        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function(nodeID) {
            var node = this.allNodes[nodeID];
            if (node) {
                delete node.parent.children[nodeID];
                node.parent = null;
                node.deinitialize();
                delete this.allNodes[nodeID];
                node = null;
            }
        },



        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function(nodeID, propertyName, propertyValue) {
            return this.initializingProperty(nodeID, propertyName, propertyValue);
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function(nodeID, propertyName, propertyValue) {
            return this.settingProperty(nodeID, propertyName, propertyValue);
        },
        resetWorld: function() {
            //here, we must reset the world whenever a new client joins. This is because the new client must be aligned. They will be 
            //initializing the world in a given state. There is stateful information internal to the physics engine that can only be reset on the other clients
            //by rebuilding the whole sim on each.
            var world = this.allNodes[vwf.application()].world;

            if (world) {
                for (var i in this.allNodes) {
                    var node = this.allNodes[i];
                    if (node.body) {
                        //call the getters, because they will cache the values to survive the reset
                        var backupTrans = node.getTransform();
                        var backupVel = node.getLinearVelocity();
                        var backupAng = node.getAngularVelocity();
                        var state = node.getActivationState();
                        var time = node.getDeactivationTime();
                        world.removeRigidBody(node.body);
                    }
                }
                world.removeRigidBody(this.allNodes[vwf.application()].ground);
                for (var i in this.allNodes) {
                    var node = this.allNodes[i];
                    if (this.allNodes[i].deinitialize)
                        this.allNodes[i].deinitialize()
                }
                delete this.allNodes[vwf.application()].world;


                Ammo.destroy(world);
            }

            var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(); // every single |new| currently leaks...
            var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            var overlappingPairCache = new Ammo.btDbvtBroadphase();
            var solver = new Ammo.btSequentialImpulseConstraintSolver();

            var dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            dynamicsWorld.setGravity(new Ammo.btVector3(0, 0, -9.8));

            this.allNodes[vwf.application()].world = dynamicsWorld;
            world = dynamicsWorld;


            var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(500, 500, .1));
            var groundTransform = new Ammo.btTransform();
            groundTransform.setIdentity();
            groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
            var mass = 0;
            var isDynamic = mass !== 0;
            var localInertia = new Ammo.btVector3(0, 0, 0);
            var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
            var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
            var body = new Ammo.btRigidBody(rbInfo);

            this.allNodes[vwf.application()].ground = body;
            world.addRigidBody(this.allNodes[vwf.application()].ground);
            //we need to see if adding the node back to the world is enough, or if we really have to kill and rebuild
            //research seems to indicate that you could just recreate the world but not all the bodies
            //but that did not work here, it needs to delay to next tick.
            for (var i in this.allNodes) {
                var node = this.allNodes[i];
                if (node.world) {

                    node.world = world;
                    node.initialized = false;
                    node.ready = false;

                    if (i != vwf.application() && node.body) {

                    }
                }
            }

            //this.reinit();



        },
        // TODO: deletingProperty
        callingMethod: function(nodeID, methodName, args) {
            //dont try to set the parent
            if (!this.allNodes[nodeID]) return;

            //don't allow reentry since this driver can both get and set transform
            if (this.reEntry === true) return;

            var node = this.allNodes[nodeID];
            if (methodName === '___physics_addForce') {

                node.addForce(args[0]);
            }
            if (methodName === '___physics_addTorque') {
                node.addTorque(args[0]);
            }
            if (methodName == '___physics_world_reset') {
                //if a client joins (who is not myself), I need to reset.
                //note that the timing of this call has been carefully examined. There can be no model changes (especially in the physics)
                //between the GetState being sent to the load client, and this event occuring. 
                // if(vwf.moniker() != args[0])
                {

                    console.log('reset world to sync late joining cleent');
                    this.resetWorld();
                }
            }
        },

        settingProperty: function(nodeID, propertyName, propertyValue) {


            //dont try to set the parent
            if (!this.allNodes[nodeID]) return;

            //don't allow reentry since this driver can both get and set transform
            if (this.reEntry === true) return;

            var node = this.allNodes[nodeID];
            if (node.ready === false) {
                if (!node.delayedProperties)
                    node.delayedProperties = {};
                node.delayedProperties[propertyName] = propertyValue;
            } else {

                if (node.body)
                    delete this.bodiesToID[node.body.ptr];

                if (propertyName === '___physics_gravity' && node.id === vwf.application()) {
                    var g = new Ammo.btVector3(propertyValue[0], propertyValue[1], propertyValue[2]);
                    node.world.setGravity(g);
                    Ammo.destroy(g);
                }
                if (propertyName === '___physics_active' && node.id === vwf.application()) {
                    node.active = propertyValue;
                }
                if (propertyName === '___physics_accuracy' && node.id === vwf.application()) {
                    node.simulationSteps = propertyValue;
                }
                if (propertyName == "transform") {
                    node.setTransform(propertyValue)
                }
                if (propertyName == 'radius' && node.type == SPHERE) {
                    node.setRadius(propertyValue);
                }
                if (propertyName == 'radius' && node.type == CYLINDER) {
                    node.setRadius(propertyValue);
                }
                if (propertyName == 'height' && node.type == CYLINDER) {
                    node.setHeight(propertyValue);
                }
                if (propertyName == 'radius' && node.type == CONE) {
                    node.setRadius(propertyValue);
                }
                if (propertyName == 'height' && node.type == CONE) {
                    node.setHeight(propertyValue);
                }
                if (propertyName == '_length' && node.type == BOX) {
                    node.setLength(propertyValue);
                }
                if (propertyName == 'width' && node.type == BOX) {
                    node.setWidth(propertyValue);
                }
                if (propertyName == 'height' && node.type == BOX) {
                    node.setHeight(propertyValue);
                }
                if (propertyName == '_length' && node.type == PLANE) {
                    node.setLength(propertyValue);
                }
                if (propertyName == 'width' && node.type == PLANE) {
                    node.setWidth(propertyValue);
                }
                if (propertyName === '___physics_enabled') {

                    if (propertyValue === true)
                        node.enable();
                    if (propertyValue === false)
                        node.disable();
                }
                if (propertyName === '___physics_mass') {
                    node.setMass(parseFloat(propertyValue));
                }
                if (propertyName === '___physics_restitution') {
                    node.setRestitution(parseFloat(propertyValue));
                }
                if (propertyName === '___physics_friction') {
                    node.setFriction(parseFloat(propertyValue));
                }
                if (propertyName === '___physics_damping') {
                    node.setDamping(parseFloat(propertyValue));
                }
                if (propertyName === '___physics_velocity_angular') {
                    node.setAngularVelocity(propertyValue);
                }
                if (propertyName === '___physics_velocity_linear') {
                    node.setLinearVelocity(propertyValue);
                }
                if (propertyName === '___physics_force_angular') {
                    node.setTorque(propertyValue);
                }
                if (propertyName === '___physics_force_linear') {
                    node.setForce(propertyValue);
                }
                if (propertyName === '___physics_activation_state') {
                    node.setActivationState(propertyValue);
                }
                if (propertyName === '___physics_deactivation_time') {
                    node.setDeactivationTime(propertyValue);
                }
                if (propertyName === '___physics_collision_width' && node.type == ASSET) {
                    node.setWidth(propertyValue);
                }
                if (propertyName === '___physics_collision_height' && node.type == ASSET) {
                    node.setHeight(propertyValue);
                }
                if (propertyName === '___physics_collision_length' && node.type == ASSET) {
                    node.setLength(propertyValue);
                }
                if (propertyName === '___physics_collision_radius' && node.type == ASSET) {
                    node.setRadius(propertyValue);
                }
                if (propertyName === '___physics_collision_type' && node.type == ASSET) {
                    node.setType(propertyValue);
                }
                if (propertyName === '___physics_collision_offset' && node.type == ASSET) {
                    node.setCollisionOffset(propertyValue);
                }
                if (propertyName === '___physics_factor_angular') {
                    node.setAngularFactor(propertyValue);
                }
                if (propertyName === '___physics_factor_linear') {
                    node.setLinearFactor(propertyValue);
                }
                //this is a hack
                //find a better way. Maybe delete the old key from the map above
                if (node.body)
                    this.bodiesToID[node.body.ptr] = nodeID;
            }

        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function(nodeID, propertyName, propertyValue) {

            //dont try to set the parent
            if (!this.allNodes[nodeID]) return;

            //don't allow reentry since this driver can both get and set transform
            if (this.reEntry === true) return;

            var node = this.allNodes[nodeID];

            if (node.ready === false) return;


            if (propertyName === '___physics_activation_state') {
                return node.getActivationState();
            }
            if (propertyName === '___physics_deactivation_time') {
                return node.getDeactivationTime();
            }
            if (propertyName === '___physics_velocity_linear') {
                return node.getLinearVelocity();
            }
            if (propertyName === '___physics_velocity_angular') {
                return node.getAngularVelocity();
            }



        },
    });

    function hasPrototype(nodeID, prototype) {
        if (!nodeID) return false;
        if (nodeID == prototype)
            return true;
        else return hasPrototype(vwf.prototype(nodeID), prototype);
    }

});