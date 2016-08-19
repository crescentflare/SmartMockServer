package com.crescentflare.smartmockexample.network;

import com.crescentflare.smartmockexample.data.Service;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Path;

/**
 * Network service: provides the service catalog
 */
public interface ServiceService
{
    /**
     * All services (without details)
     */
    @GET("services")
    Call<List<Service>> services();

    /**
     * A single service with details
     */
    @GET("services/{id}")
    Call<Service> service(@Path("id") String id);
}
