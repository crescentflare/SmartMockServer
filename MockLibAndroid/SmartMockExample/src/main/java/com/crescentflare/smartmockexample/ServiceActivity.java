package com.crescentflare.smartmockexample;

import android.graphics.Color;
import android.os.Bundle;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.view.MenuItem;
import android.view.View;
import android.widget.TextView;

import com.crescentflare.smartmockexample.data.ApiError;
import com.crescentflare.smartmockexample.data.Service;
import com.crescentflare.smartmockexample.network.Api;
import com.crescentflare.smartmockexample.network.ApiException;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * The service activity shows details about a single service
 */
public class ServiceActivity extends AppCompatActivity implements Callback<Service>
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
        setContentView(R.layout.activity_service);
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null)
        {
            actionBar.setDisplayHomeAsUpEnabled(true);
            actionBar.setHomeButtonEnabled(true);
        }
        setTitle(getString(R.string.title_service));
        Api.service().service(getIntent().getStringExtra(ARG_ID)).enqueue(this);
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
    public void onResponse(Call<Service> call, Response<Service> response)
    {
        findViewById(R.id.service_spinner).setVisibility(View.GONE);
        findViewById(R.id.service_name).setVisibility(View.VISIBLE);
        findViewById(R.id.service_description).setVisibility(View.VISIBLE);
        findViewById(R.id.service_price).setVisibility(View.VISIBLE);
        ((TextView)findViewById(R.id.service_name)).setTextColor(Color.DKGRAY);
        ((TextView)findViewById(R.id.service_name)).setText(response.body().getName());
        ((TextView)findViewById(R.id.service_description)).setText(response.body().getDescription());
        if (response.body().getPrice() == 0)
        {
            ((TextView)findViewById(R.id.service_price)).setText(getString(R.string.price_free));
        }
        else
        {
            ((TextView)findViewById(R.id.service_price)).setText(getString(R.string.price_number, response.body().getPrice()));
        }
    }

    @Override
    public void onFailure(Call<Service> call, Throwable t)
    {
        String errorMessage = null;
        findViewById(R.id.service_spinner).setVisibility(View.GONE);
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
        findViewById(R.id.service_name).setVisibility(View.VISIBLE);
        findViewById(R.id.service_description).setVisibility(View.VISIBLE);
        findViewById(R.id.service_price).setVisibility(View.GONE);
        ((TextView)findViewById(R.id.service_description)).setTextColor(Color.RED);
        ((TextView)findViewById(R.id.service_name)).setText(R.string.error_title_service);
        ((TextView)findViewById(R.id.service_description)).setText(errorMessage);
    }
}
