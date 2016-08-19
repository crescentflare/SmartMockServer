package com.crescentflare.smartmockexample;

import android.graphics.Color;
import android.os.Bundle;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.view.MenuItem;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import com.crescentflare.smartmockexample.data.ApiError;
import com.crescentflare.smartmockexample.data.Product;
import com.crescentflare.smartmockexample.network.Api;
import com.crescentflare.smartmockexample.network.ApiException;
import com.squareup.picasso.Picasso;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * The product activity shows details about a single product
 */
public class ProductActivity extends AppCompatActivity implements Callback<Product>
{
    /**
     * Constants
     */

    private static final String ARG_ID = "arg_id";


    /**
     * Initialization
     */

    public static Bundle bundleForNew(String id)
    {
        Bundle bundle = new Bundle();
        bundle.putString(ARG_ID, id);
        return bundle;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_product);
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null)
        {
            actionBar.setDisplayHomeAsUpEnabled(true);
            actionBar.setHomeButtonEnabled(true);
        }
        setTitle(getString(R.string.title_product));
        Api.product().product(getIntent().getStringExtra(ARG_ID)).enqueue(this);
    }


    /**
     * Menu handling
     */

    @Override
    public boolean onOptionsItemSelected(MenuItem item)
    {
        if (item.getItemId() == android.R.id.home)
        {
            onBackPressed();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }


    /**
     * Content handling
     */

    @Override
    public void onResponse(Call<Product> call, Response<Product> response)
    {
        findViewById(R.id.product_spinner).setVisibility(View.GONE);
        findViewById(R.id.product_image).setVisibility(View.VISIBLE);
        findViewById(R.id.product_name).setVisibility(View.VISIBLE);
        findViewById(R.id.product_description).setVisibility(View.VISIBLE);
        findViewById(R.id.product_price).setVisibility(View.VISIBLE);
        Api.picassoFor(this, response.body().getImage()).resize(0, (int)(getResources().getDisplayMetrics().density * 128)).into((ImageView)findViewById(R.id.product_image));
        ((TextView)findViewById(R.id.product_name)).setTextColor(Color.DKGRAY);
        ((TextView)findViewById(R.id.product_name)).setText(response.body().getName());
        ((TextView)findViewById(R.id.product_description)).setText(response.body().getDescription());
        if (response.body().getPrice() == 0)
        {
            ((TextView)findViewById(R.id.product_price)).setText(getString(R.string.price_free));
        }
        else
        {
            ((TextView)findViewById(R.id.product_price)).setText(getString(R.string.price_number, response.body().getPrice()));
        }
    }

    @Override
    public void onFailure(Call<Product> call, Throwable t)
    {
        String errorMessage = null;
        findViewById(R.id.product_spinner).setVisibility(View.GONE);
        if (t instanceof ApiException)
        {
            ApiError error = ((ApiException)t).getError();
            if (error != null)
            {
                errorMessage = error.getMessage();
            }
        }
        if (errorMessage == null)
        {
            errorMessage = getString(R.string.error_generic);
        }
        findViewById(R.id.product_image).setVisibility(View.GONE);
        findViewById(R.id.product_name).setVisibility(View.VISIBLE);
        findViewById(R.id.product_description).setVisibility(View.VISIBLE);
        findViewById(R.id.product_price).setVisibility(View.GONE);
        ((TextView)findViewById(R.id.product_description)).setTextColor(Color.RED);
        ((TextView)findViewById(R.id.product_name)).setText(R.string.error_title_product);
        ((TextView)findViewById(R.id.product_description)).setText(errorMessage);
    }
}
