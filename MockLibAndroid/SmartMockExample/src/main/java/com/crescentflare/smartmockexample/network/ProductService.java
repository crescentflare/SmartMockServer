package com.crescentflare.smartmockexample.network;

import com.crescentflare.smartmockexample.data.Product;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Path;

/**
 * Network service: provides the product catalog
 */
public interface ProductService
{
    /**
     * All products (without details)
     */
    @GET("products")
    Call<List<Product>> products();

    /**
     * A single product with details
     */
    @GET("products/{id}")
    Call<Product> product(@Path("id") String id);
}
