package com.crescentflare.smartmockexample.network;

import com.crescentflare.smartmockexample.data.User;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * Network service: the main interface between app and network
 */
public class Api
{
    /**
     * Singleton instance and constants
     */

    private static final boolean enableMocking = true;
    public static final String mockUrl = "file:///endpoints";
    public static final String baseUrl = "http://127.0.0.1:2143";
    public static final Api instance = new Api(baseUrl);


    /**
     * Members
     */

    private Retrofit retrofit = null;
    private ApiCookies cookieJar = null;
    private AuthenticationService authentication = null;
    private ProductService product = null;
    private ServiceService service = null;
    private User currentUser = null;


    /**
     * Initialization
     */

    private Api(String baseUrl)
    {
        // Set up okhttp client with logging
        HttpLoggingInterceptor logInterceptor = new HttpLoggingInterceptor();
        logInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
        cookieJar = new ApiCookies();
        OkHttpClient.Builder builder = new OkHttpClient.Builder().addInterceptor(logInterceptor).addInterceptor(new ApiErrorInterceptor()).cookieJar(cookieJar);
        if (enableMocking)
        {
            builder.addInterceptor(new MockInterceptor(baseUrl, mockUrl)); //It's important that this one is added at the end (for example, to make it work with the error interceptor)
        }
        OkHttpClient client = builder.build();

        // Create retrofit object and services
        retrofit = new Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        authentication = retrofit.create(AuthenticationService.class);
        product = retrofit.create(ProductService.class);
        service = retrofit.create(ServiceService.class);
    }


    /**
     * Obtain services
     */

    public static AuthenticationService authentication()
    {
        return instance.authentication;
    }

    public static ProductService product()
    {
        return instance.product;
    }

    public static ServiceService service()
    {
        return instance.service;
    }


    /**
     * Access currently logged in user
     */

    public static void setCurrentUser(User user)
    {
        instance.currentUser = user;
        if (user == null && instance.cookieJar != null)
        {
            instance.cookieJar.clear();
        }
    }

    public static User currentUser()
    {
        return instance.currentUser;
    }
}
