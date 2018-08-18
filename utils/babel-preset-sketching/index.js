module.exports = function(api, opts) {
  const prod = process.env.NODE_ENV === "production";

  return {
    presets: [
      [
        require("@babel/preset-env"),
        {
          targets: {
            browsers: [">1%", "not ie 11"]
          }
        }
      ],
      require("@babel/preset-flow"),
      require("@babel/preset-react")
    ],
    plugins: [
      require("@babel/plugin-proposal-class-properties").default,
      require("@babel/plugin-proposal-object-rest-spread").default,
      require("@babel/plugin-proposal-numeric-separator").default,
      require("@babel/plugin-transform-classes").default,
      require("@babel/plugin-transform-destructuring").default,
      prod && require("@babel/plugin-transform-react-constant-elements").default
    ].filter(Boolean)
  };
};