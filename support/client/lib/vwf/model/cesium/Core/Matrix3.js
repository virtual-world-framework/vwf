/*global define*/
define([
        './Cartesian3',
        './defaultValue',
        './defined',
        './DeveloperError',
        './freezeObject'
    ], function(
        Cartesian3,
        defaultValue,
        defined,
        DeveloperError,
        freezeObject) {
    "use strict";

    /**
     * A 3x3 matrix, indexable as a column-major order array.
     * Constructor parameters are in row-major order for code readability.
     * @alias Matrix3
     * @constructor
     *
     * @param {Number} [column0Row0=0.0] The value for column 0, row 0.
     * @param {Number} [column1Row0=0.0] The value for column 1, row 0.
     * @param {Number} [column2Row0=0.0] The value for column 2, row 0.
     * @param {Number} [column0Row1=0.0] The value for column 0, row 1.
     * @param {Number} [column1Row1=0.0] The value for column 1, row 1.
     * @param {Number} [column2Row1=0.0] The value for column 2, row 1.
     * @param {Number} [column0Row2=0.0] The value for column 0, row 2.
     * @param {Number} [column1Row2=0.0] The value for column 1, row 2.
     * @param {Number} [column2Row2=0.0] The value for column 2, row 2.
     *
     * @see Matrix3.fromColumnMajor
     * @see Matrix3.fromRowMajorArray
     * @see Matrix3.fromQuaternion
     * @see Matrix3.fromScale
     * @see Matrix3.fromUniformScale
     * @see Matrix2
     * @see Matrix4
     */
    var Matrix3 = function(column0Row0, column1Row0, column2Row0,
                           column0Row1, column1Row1, column2Row1,
                           column0Row2, column1Row2, column2Row2) {
        this[0] = defaultValue(column0Row0, 0.0);
        this[1] = defaultValue(column0Row1, 0.0);
        this[2] = defaultValue(column0Row2, 0.0);
        this[3] = defaultValue(column1Row0, 0.0);
        this[4] = defaultValue(column1Row1, 0.0);
        this[5] = defaultValue(column1Row2, 0.0);
        this[6] = defaultValue(column2Row0, 0.0);
        this[7] = defaultValue(column2Row1, 0.0);
        this[8] = defaultValue(column2Row2, 0.0);
    };

    /**
     * Duplicates a Matrix3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to duplicate.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided. (Returns undefined if matrix is undefined)
     */
    Matrix3.clone = function(values, result) {
        if (!defined(values)) {
            return undefined;
        }
        if (!defined(result)) {
            return new Matrix3(values[0], values[3], values[6],
                               values[1], values[4], values[7],
                               values[2], values[5], values[8]);
        }
        result[0] = values[0];
        result[1] = values[1];
        result[2] = values[2];
        result[3] = values[3];
        result[4] = values[4];
        result[5] = values[5];
        result[6] = values[6];
        result[7] = values[7];
        result[8] = values[8];
        return result;
    };

    /**
     * Creates a Matrix3 instance from a column-major order array.
     * @memberof Matrix3
     * @function
     *
     * @param {Array} values The column-major order array.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} values is required.
     */
    Matrix3.fromColumnMajorArray = function(values, result) {
        if (!defined(values)) {
            throw new DeveloperError('values parameter is required');
        }
        return Matrix3.clone(values, result);
    };

    /**
     * Creates a Matrix3 instance from a row-major order array.
     * The resulting matrix will be in column-major order.
     * @memberof Matrix3
     *
     * @param {Array} values The row-major order array.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} values is required.
     */
    Matrix3.fromRowMajorArray = function(values, result) {
        if (!defined(values)) {
            throw new DeveloperError('values is required.');
        }
        if (!defined(result)) {
            return new Matrix3(values[0], values[1], values[2],
                               values[3], values[4], values[5],
                               values[6], values[7], values[8]);
        }
        result[0] = values[0];
        result[1] = values[3];
        result[2] = values[6];
        result[3] = values[1];
        result[4] = values[4];
        result[5] = values[7];
        result[6] = values[2];
        result[7] = values[5];
        result[8] = values[8];
        return result;
    };

    /**
     * Computes a 3x3 rotation matrix from the provided quaternion.
     * @memberof Matrix3
     *
     * @param {Quaternion} quaternion the quaternion to use.
     *
     * @returns {Matrix3} The 3x3 rotation matrix from this quaternion.
     */
    Matrix3.fromQuaternion = function(quaternion, result) {
        if (!defined(quaternion)) {
            throw new DeveloperError('quaternion is required');
        }
        var x2 = quaternion.x * quaternion.x;
        var xy = quaternion.x * quaternion.y;
        var xz = quaternion.x * quaternion.z;
        var xw = quaternion.x * quaternion.w;
        var y2 = quaternion.y * quaternion.y;
        var yz = quaternion.y * quaternion.z;
        var yw = quaternion.y * quaternion.w;
        var z2 = quaternion.z * quaternion.z;
        var zw = quaternion.z * quaternion.w;
        var w2 = quaternion.w * quaternion.w;

        var m00 = x2 - y2 - z2 + w2;
        var m01 = 2.0 * (xy + zw);
        var m02 = 2.0 * (xz - yw);

        var m10 = 2.0 * (xy - zw);
        var m11 = -x2 + y2 - z2 + w2;
        var m12 = 2.0 * (yz + xw);

        var m20 = 2.0 * (xz + yw);
        var m21 = 2.0 * (yz - xw);
        var m22 = -x2 - y2 + z2 + w2;

        if (!defined(result)) {
            return new Matrix3(m00, m01, m02,
                               m10, m11, m12,
                               m20, m21, m22);
        }
        result[0] = m00;
        result[1] = m10;
        result[2] = m20;
        result[3] = m01;
        result[4] = m11;
        result[5] = m21;
        result[6] = m02;
        result[7] = m12;
        result[8] = m22;
        return result;
    };

    /**
     * Computes a Matrix3 instance representing a non-uniform scale.
     * @memberof Matrix3
     *
     * @param {Cartesian3} scale The x, y, and z scale factors.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} scale is required.
     *
     * @example
     * // Creates
     * //   [7.0, 0.0, 0.0]
     * //   [0.0, 8.0, 0.0]
     * //   [0.0, 0.0, 9.0]
     * var m = Matrix3.fromScale(new Cartesian3(7.0, 8.0, 9.0));
     */
    Matrix3.fromScale = function(scale, result) {
        if (!defined(scale)) {
            throw new DeveloperError('scale is required.');
        }
        if (!defined(result)) {
            return new Matrix3(
                scale.x, 0.0,     0.0,
                0.0,     scale.y, 0.0,
                0.0,     0.0,     scale.z);
        }

        result[0] = scale.x;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = scale.y;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = scale.z;
        return result;
    };

    /**
     * Computes a Matrix3 instance representing a uniform scale.
     * @memberof Matrix3
     *
     * @param {Number} scale The uniform scale factor.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} scale is required.
     *
     * @example
     * // Creates
     * //   [2.0, 0.0, 0.0]
     * //   [0.0, 2.0, 0.0]
     * //   [0.0, 0.0, 2.0]
     * var m = Matrix3.fromUniformScale(2.0);
     */
    Matrix3.fromUniformScale = function(scale, result) {
        if (typeof scale !== 'number') {
            throw new DeveloperError('scale is required.');
        }
        if (!defined(result)) {
            return new Matrix3(
                scale, 0.0,   0.0,
                0.0,   scale, 0.0,
                0.0,   0.0,   scale);
        }

        result[0] = scale;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = scale;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = scale;
        return result;
    };

    /**
     * Creates a rotation matrix around the x-axis.
     *
     * @param {Number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     *
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} angle is required.
     *
     * @example
     * // Rotate a point 45 degrees counterclockwise around the x-axis.
     * var p = new Cartesian3(5, 6, 7);
     * var m = Matrix3.fromRotationX(CesiumMath.toRadians(45.0));
     * var rotated = m.multiplyByVector(p);
     */
    Matrix3.fromRotationX = function(angle, result) {
        if (!defined(angle)) {
            throw new DeveloperError('angle is required.');
        }

        var cosAngle = Math.cos(angle);
        var sinAngle = Math.sin(angle);

        if (!defined(result)) {
            return new Matrix3(
                1.0, 0.0, 0.0,
                0.0, cosAngle, -sinAngle,
                0.0, sinAngle, cosAngle);
        }

        result[0] = 1.0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = cosAngle;
        result[5] = sinAngle;
        result[6] = 0.0;
        result[7] = -sinAngle;
        result[8] = cosAngle;

        return result;
    };

    /**
     * Creates a rotation matrix around the y-axis.
     *
     * @param {Number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     *
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} angle is required.
     *
     * @example
     * // Rotate a point 45 degrees counterclockwise around the y-axis.
     * var p = new Cartesian3(5, 6, 7);
     * var m = Matrix3.fromRotationY(CesiumMath.toRadians(45.0));
     * var rotated = m.multiplyByVector(p);
     */
    Matrix3.fromRotationY = function(angle, result) {
        if (!defined(angle)) {
            throw new DeveloperError('angle is required.');
        }

        var cosAngle = Math.cos(angle);
        var sinAngle = Math.sin(angle);

        if (!defined(result)) {
            return new Matrix3(
                cosAngle, 0.0, sinAngle,
                0.0, 1.0, 0.0,
                -sinAngle, 0.0, cosAngle);
        }

        result[0] = cosAngle;
        result[1] = 0.0;
        result[2] = -sinAngle;
        result[3] = 0.0;
        result[4] = 1.0;
        result[5] = 0.0;
        result[6] = sinAngle;
        result[7] = 0.0;
        result[8] = cosAngle;

        return result;
    };

    /**
     * Creates a rotation matrix around the z-axis.
     *
     * @param {Number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     *
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} angle is required.
     *
     * @example
     * // Rotate a point 45 degrees counterclockwise around the z-axis.
     * var p = new Cartesian3(5, 6, 7);
     * var m = Matrix3.fromRotationZ(CesiumMath.toRadians(45.0));
     * var rotated = m.multiplyByVector(p);
     */
    Matrix3.fromRotationZ = function(angle, result) {
        if (!defined(angle)) {
            throw new DeveloperError('angle is required.');
        }

        var cosAngle = Math.cos(angle);
        var sinAngle = Math.sin(angle);

        if (!defined(result)) {
            return new Matrix3(
                cosAngle, -sinAngle, 0.0,
                sinAngle, cosAngle, 0.0,
                0.0, 0.0, 1.0);
        }

        result[0] = cosAngle;
        result[1] = sinAngle;
        result[2] = 0.0;
        result[3] = -sinAngle;
        result[4] = cosAngle;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 1.0;

        return result;
    };

    /**
     * Creates an Array from the provided Matrix3 instance.
     * The array will be in column-major order.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to use..
     * @param {Array} [result] The Array onto which to store the result.
     * @returns {Array} The modified Array parameter or a new Array instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     */
    Matrix3.toArray = function(matrix, result) {
        if (!defined(matrix)) {
            throw new DeveloperError('matrix is required');
        }
        if (!defined(result)) {
            return [matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5], matrix[6], matrix[7], matrix[8]];
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        return result;
    };

    /**
     * Computes the array index of the element at the provided row and column.
     * @memberof Matrix3
     *
     * @param {Number} row The zero-based index of the row.
     * @param {Number} column The zero-based index of the column.
     * @returns {Number} The index of the element at the provided row and column.
     *
     * @exception {DeveloperError} row is required and must be 0, 1, or 2.
     * @exception {DeveloperError} column is required and must be 0, 1, or 2.
     *
     * @example
     * var myMatrix = new Matrix3();
     * var column1Row0Index = Matrix3.getElementIndex(1, 0);
     * var column1Row0 = myMatrix[column1Row0Index]
     * myMatrix[column1Row0Index] = 10.0;
     */
    Matrix3.getElementIndex = function(column, row) {
        if (typeof row !== 'number' || row < 0 || row > 2) {
            throw new DeveloperError('row is required and must be 0, 1, or 2.');
        }
        if (typeof column !== 'number' || column < 0 || column > 2) {
            throw new DeveloperError('column is required and must be 0, 1, or 2.');
        }
        return column * 3 + row;
    };

    /**
     * Retrieves a copy of the matrix column at the provided index as a Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to use.
     * @param {Number} index The zero-based index of the column to retrieve.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.getColumn = function(matrix, index, result) {
        if (!defined(matrix)) {
            throw new DeveloperError('matrix is required.');
        }

        if (typeof index !== 'number' || index < 0 || index > 2) {
            throw new DeveloperError('index is required and must be 0, 1, or 2.');
        }

        var startIndex = index * 3;
        var x = matrix[startIndex];
        var y = matrix[startIndex + 1];
        var z = matrix[startIndex + 2];

        if (!defined(result)) {
            return new Cartesian3(x, y, z);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Computes a new matrix that replaces the specified column in the provided matrix with the provided Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to use.
     * @param {Number} index The zero-based index of the column to set.
     * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified column.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.setColumn = function(matrix, index, cartesian, result) {
        if (!defined(matrix)) {
            throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof index !== 'number' || index < 0 || index > 2) {
            throw new DeveloperError('index is required and must be 0, 1, or 2.');
        }
        result = Matrix3.clone(matrix, result);
        var startIndex = index * 3;
        result[startIndex] = cartesian.x;
        result[startIndex + 1] = cartesian.y;
        result[startIndex + 2] = cartesian.z;
        return result;
    };

    /**
     * Retrieves a copy of the matrix row at the provided index as a Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to use.
     * @param {Number} index The zero-based index of the row to retrieve.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.getRow = function(matrix, index, result) {
        if (!defined(matrix)) {
            throw new DeveloperError('matrix is required.');
        }

        if (typeof index !== 'number' || index < 0 || index > 2) {
            throw new DeveloperError('index is required and must be 0, 1, or 2.');
        }

        var x = matrix[index];
        var y = matrix[index + 3];
        var z = matrix[index + 6];

        if (!defined(result)) {
            return new Cartesian3(x, y, z);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Computes a new matrix that replaces the specified row in the provided matrix with the provided Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to use.
     * @param {Number} index The zero-based index of the row to set.
     * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified row.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.setRow = function(matrix, index, cartesian, result) {
        if (!defined(matrix)) {
            throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof index !== 'number' || index < 0 || index > 2) {
            throw new DeveloperError('index is required and must be 0, 1, or 2.');
        }

        result = Matrix3.clone(matrix, result);
        result[index] = cartesian.x;
        result[index + 3] = cartesian.y;
        result[index + 6] = cartesian.z;
        return result;
    };

    /**
     * Computes the product of two matrices.
     * @memberof Matrix3
     *
     * @param {Matrix3} left The first matrix.
     * @param {Matrix3} right The second matrix.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Matrix3.multiply = function(left, right, result) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
            throw new DeveloperError('right is required');
        }

        var column0Row0 = left[0] * right[0] + left[3] * right[1] + left[6] * right[2];
        var column0Row1 = left[1] * right[0] + left[4] * right[1] + left[7] * right[2];
        var column0Row2 = left[2] * right[0] + left[5] * right[1] + left[8] * right[2];

        var column1Row0 = left[0] * right[3] + left[3] * right[4] + left[6] * right[5];
        var column1Row1 = left[1] * right[3] + left[4] * right[4] + left[7] * right[5];
        var column1Row2 = left[2] * right[3] + left[5] * right[4] + left[8] * right[5];

        var column2Row0 = left[0] * right[6] + left[3] * right[7] + left[6] * right[8];
        var column2Row1 = left[1] * right[6] + left[4] * right[7] + left[7] * right[8];
        var column2Row2 = left[2] * right[6] + left[5] * right[7] + left[8] * right[8];

        if (!defined(result)) {
            return new Matrix3(column0Row0, column1Row0, column2Row0,
                               column0Row1, column1Row1, column2Row1,
                               column0Row2, column1Row2, column2Row2);
        }
        result[0] = column0Row0;
        result[1] = column0Row1;
        result[2] = column0Row2;
        result[3] = column1Row0;
        result[4] = column1Row1;
        result[5] = column1Row2;
        result[6] = column2Row0;
        result[7] = column2Row1;
        result[8] = column2Row2;
        return result;
    };

    /**
     * Computes the product of a matrix and a column vector.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix.
     * @param {Cartesian3} cartesian The column.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} cartesian is required.
     */
    Matrix3.multiplyByVector = function(matrix, cartesian, result) {
        if (!defined(matrix)) {
            throw new DeveloperError('matrix is required');
        }
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }

        var vX = cartesian.x;
        var vY = cartesian.y;
        var vZ = cartesian.z;

        var x = matrix[0] * vX + matrix[3] * vY + matrix[6] * vZ;
        var y = matrix[1] * vX + matrix[4] * vY + matrix[7] * vZ;
        var z = matrix[2] * vX + matrix[5] * vY + matrix[8] * vZ;

        if (!defined(result)) {
            return new Cartesian3(x, y, z);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Computes the product of a matrix and a scalar.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix.
     * @param {Number} scalar The number to multiply by.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Matrix3.multiplyByScalar = function(matrix, scalar, result) {
        if (!defined(matrix)) {
            throw new DeveloperError('matrix is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number');
        }

        if (!defined(result)) {
            return new Matrix3(matrix[0] * scalar, matrix[3] * scalar, matrix[6] * scalar,
                               matrix[1] * scalar, matrix[4] * scalar, matrix[7] * scalar,
                               matrix[2] * scalar, matrix[5] * scalar, matrix[8] * scalar);
        }
        result[0] = matrix[0] * scalar;
        result[1] = matrix[1] * scalar;
        result[2] = matrix[2] * scalar;
        result[3] = matrix[3] * scalar;
        result[4] = matrix[4] * scalar;
        result[5] = matrix[5] * scalar;
        result[6] = matrix[6] * scalar;
        result[7] = matrix[7] * scalar;
        result[8] = matrix[8] * scalar;
        return result;
    };

    /**
     * Creates a negated copy of the provided matrix.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to negate.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     */
    Matrix3.negate = function(matrix, result) {
        if (!defined(matrix)) {
            throw new DeveloperError('matrix is required');
        }

        if (!defined(result)) {
            return new Matrix3(-matrix[0], -matrix[3], -matrix[6],
                               -matrix[1], -matrix[4], -matrix[7],
                               -matrix[2], -matrix[5], -matrix[8]);
        }
        result[0] = -matrix[0];
        result[1] = -matrix[1];
        result[2] = -matrix[2];
        result[3] = -matrix[3];
        result[4] = -matrix[4];
        result[5] = -matrix[5];
        result[6] = -matrix[6];
        result[7] = -matrix[7];
        result[8] = -matrix[8];
        return result;
    };

    /**
     * Computes the transpose of the provided matrix.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to transpose.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     */
    Matrix3.transpose = function(matrix, result) {
        if (!defined(matrix)) {
            throw new DeveloperError('matrix is required');
        }

        var column0Row0 = matrix[0];
        var column0Row1 = matrix[3];
        var column0Row2 = matrix[6];
        var column1Row0 = matrix[1];
        var column1Row1 = matrix[4];
        var column1Row2 = matrix[7];
        var column2Row0 = matrix[2];
        var column2Row1 = matrix[5];
        var column2Row2 = matrix[8];

        if (!defined(result)) {
            return new Matrix3(column0Row0, column1Row0, column2Row0,
                               column0Row1, column1Row1, column2Row1,
                               column0Row2, column1Row2, column2Row2);
        }
        result[0] = column0Row0;
        result[1] = column0Row1;
        result[2] = column0Row2;
        result[3] = column1Row0;
        result[4] = column1Row1;
        result[5] = column1Row2;
        result[6] = column2Row0;
        result[7] = column2Row1;
        result[8] = column2Row2;
        return result;
    };

    /**
     * Compares the provided matrices componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Matrix3
     *
     * @param {Matrix3} [left] The first matrix.
     * @param {Matrix3} [right] The second matrix.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Matrix3.equals = function(left, right) {
        return (left === right) ||
               (defined(left) &&
                defined(right) &&
                left[0] === right[0] &&
                left[1] === right[1] &&
                left[2] === right[2] &&
                left[3] === right[3] &&
                left[4] === right[4] &&
                left[5] === right[5] &&
                left[6] === right[6] &&
                left[7] === right[7] &&
                left[8] === right[8]);
    };

    /**
     * Compares the provided matrices componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Matrix3
     *
     * @param {Matrix3} [left] The first matrix.
     * @param {Matrix3} [right] The second matrix.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Matrix3.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
            throw new DeveloperError('epsilon is required and must be a number');
        }

        return (left === right) ||
                (defined(left) &&
                defined(right) &&
                Math.abs(left[0] - right[0]) <= epsilon &&
                Math.abs(left[1] - right[1]) <= epsilon &&
                Math.abs(left[2] - right[2]) <= epsilon &&
                Math.abs(left[3] - right[3]) <= epsilon &&
                Math.abs(left[4] - right[4]) <= epsilon &&
                Math.abs(left[5] - right[5]) <= epsilon &&
                Math.abs(left[6] - right[6]) <= epsilon &&
                Math.abs(left[7] - right[7]) <= epsilon &&
                Math.abs(left[8] - right[8]) <= epsilon);
    };

    /**
     * An immutable Matrix3 instance initialized to the identity matrix.
     * @memberof Matrix3
     */
    Matrix3.IDENTITY = freezeObject(new Matrix3(1.0, 0.0, 0.0,
                                                0.0, 1.0, 0.0,
                                                0.0, 0.0, 1.0));

    /**
     * The index into Matrix3 for column 0, row 0.
     * @memberof Matrix3
     */
    Matrix3.COLUMN0ROW0 = 0;

    /**
     * The index into Matrix3 for column 0, row 1.
     * @memberof Matrix3
     */
    Matrix3.COLUMN0ROW1 = 1;

    /**
     * The index into Matrix3 for column 0, row 2.
     * @memberof Matrix3
     */
    Matrix3.COLUMN0ROW2 = 2;

    /**
     * The index into Matrix3 for column 1, row 0.
     * @memberof Matrix3
     */
    Matrix3.COLUMN1ROW0 = 3;

    /**
     * The index into Matrix3 for column 1, row 1.
     * @memberof Matrix3
     */
    Matrix3.COLUMN1ROW1 = 4;

    /**
     * The index into Matrix3 for column 1, row 2.
     * @memberof Matrix3
     */
    Matrix3.COLUMN1ROW2 = 5;

    /**
     * The index into Matrix3 for column 2, row 0.
     * @memberof Matrix3
     */
    Matrix3.COLUMN2ROW0 = 6;

    /**
     * The index into Matrix3 for column 2, row 1.
     * @memberof Matrix3
     */
    Matrix3.COLUMN2ROW1 = 7;

    /**
     * The index into Matrix3 for column 2, row 2.
     * @memberof Matrix3
     */
    Matrix3.COLUMN2ROW2 = 8;

    /**
     * Duplicates the provided Matrix3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     */
    Matrix3.prototype.clone = function(result) {
        return Matrix3.clone(this, result);
    };

    /**
     * Creates an Array from this Matrix3 instance.
     * @memberof Matrix3
     *
     * @param {Array} [result] The Array onto which to store the result.
     * @returns {Array} The modified Array parameter or a new Array instance if one was not provided.
     */
    Matrix3.prototype.toArray = function(result) {
        return Matrix3.toArray(this, result);
    };

    /**
     * Retrieves a copy of the matrix column at the provided index as a Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Number} index The zero-based index of the column to retrieve.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.prototype.getColumn = function(index, result) {
        return Matrix3.getColumn(this, index, result);
    };

    /**
     * Computes a new matrix that replaces the specified column in this matrix with the provided Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Number} index The zero-based index of the column to set.
     * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified column.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.prototype.setColumn = function(index, cartesian, result) {
        return Matrix3.setColumn(this, index, cartesian, result);
    };

    /**
     * Retrieves a copy of the matrix row at the provided index as a Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Number} index The zero-based index of the row to retrieve.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.prototype.getRow = function(index, result) {
        return Matrix3.getRow(this, index, result);
    };

    /**
     * Computes a new matrix that replaces the specified row in this matrix with the provided Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Number} index The zero-based index of the row to set.
     * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified row.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.prototype.setRow = function(index, cartesian, result) {
        return Matrix3.setRow(this, index, cartesian, result);
    };

    /**
     * Computes the product of this matrix and the provided matrix.
     * @memberof Matrix3
     *
     * @param {Matrix3} right The right hand side matrix.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} right is required.
     */
    Matrix3.prototype.multiply = function(right, result) {
        return Matrix3.multiply(this, right, result);
    };

    /**
     * Computes the product of this matrix and a column vector.
     * @memberof Matrix3
     *
     * @param {Cartesian3} cartesian The column.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Matrix3.prototype.multiplyByVector = function(cartesian, result) {
        return Matrix3.multiplyByVector(this, cartesian, result);
    };

    /**
     * Computes the product of this matrix and a scalar.
     * @memberof Matrix3
     *
     * @param {Number} scalar The number to multiply by.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Matrix3.prototype.multiplyByScalar = function(scalar, result) {
        return Matrix3.multiplyByScalar(this, scalar, result);
    };
    /**
     * Creates a negated copy of this matrix.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to negate.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     */
    Matrix3.prototype.negate = function(result) {
        return Matrix3.negate(this, result);
    };

    /**
     * Computes the transpose of this matrix.
     * @memberof Matrix3
     *
     * @param {Matrix3} [result] The object onto which to store the result.
     * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     */
    Matrix3.prototype.transpose = function(result) {
        return Matrix3.transpose(this, result);
    };

    /**
     * Compares this matrix to the provided matrix componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Matrix3
     *
     * @param {Matrix3} [right] The right hand side matrix.
     * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    Matrix3.prototype.equals = function(right) {
        return Matrix3.equals(this, right);
    };

    /**
     * Compares this matrix to the provided matrix componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Matrix3
     *
     * @param {Matrix3} [right] The right hand side matrix.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @returns {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Matrix3.prototype.equalsEpsilon = function(right, epsilon) {
        return Matrix3.equalsEpsilon(this, right, epsilon);
    };

    /**
     * Creates a string representing this Matrix with each row being
     * on a separate line and in the format '(column0, column1, column2)'.
     * @memberof Matrix3
     *
     * @returns {String} A string representing the provided Matrix with each row being on a separate line and in the format '(column0, column1, column2)'.
     */
    Matrix3.prototype.toString = function() {
        return '(' + this[0] + ', ' + this[3] + ', ' + this[6] + ')\n' +
               '(' + this[1] + ', ' + this[4] + ', ' + this[7] + ')\n' +
               '(' + this[2] + ', ' + this[5] + ', ' + this[8] + ')';
    };

    return Matrix3;
});