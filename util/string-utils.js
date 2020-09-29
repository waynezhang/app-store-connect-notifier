const StringUtils = {

  capitalizeString: function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  },

  formatState: function(str) {
    return str
      .toLowerCase()
      .split('_')
      .map((s) => StringUtils.capitalizeString(s))
      .join(' ');
  }
};

module.exports = StringUtils;
