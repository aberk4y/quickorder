import products from "../data/products.js";

export const getProducts = (req, res) => {
  res.json(products);
};