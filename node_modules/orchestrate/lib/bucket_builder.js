// Copyright 2015 Orchestrate


function BucketBuilder () {
  this.buckets = [];
}

BucketBuilder.prototype.before = function (a) {
  this.buckets.push('*~' + a);
  return this;
};

BucketBuilder.prototype.between = function (a, b) {
  this.buckets.push([a, b].join('~'));
  return this;
};

BucketBuilder.prototype.after = function (a) {
  this.buckets.push(a + '~*');
  return this;
};

BucketBuilder.prototype.build = function () {
  return this.buckets.join(':');
}

module.exports = BucketBuilder;
