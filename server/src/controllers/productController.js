import products from "../data/products.js";

export const getProducts = (req, res) => {
  res.json(products);
};

export const createProduct = (
  req,
  res
) => {
  const newProduct = {
    id: Date.now(),
    ...req.body,
  };

  products.push(newProduct);

  res.status(201).json(newProduct);
};


export const updateProduct = (
  req,
  res
) => {
  const { id } = req.params;

  const product = products.find(
    (product) => product.id == id
  );

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  const {
    name,
    price,
    category,
    image,
  } = req.body;

  product.name = name;
  product.price = price;
  product.category = category;
  product.image = image;

  res.json(product);
};

export const deleteProduct = (
  req,
  res
) => {
  const { id } = req.params;

  const productIndex =
    products.findIndex(
      (product) => product.id == id
    );

  if (productIndex === -1) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  products.splice(productIndex, 1);

  res.json({
    message: "Product deleted",
  });
};