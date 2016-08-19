package com.crescentflare.smartmockexample;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.crescentflare.smartmockexample.data.ApiError;
import com.crescentflare.smartmockexample.data.Product;
import com.crescentflare.smartmockexample.data.Service;
import com.crescentflare.smartmockexample.network.Api;
import com.crescentflare.smartmockexample.network.ApiException;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * The example activity connects to the server to fetch data for display
 */
public class MainActivity extends AppCompatActivity
{
    /**
     * Members
     */

    private int waitRefreshCalls = 0;


    /**
     * Initialization
     */

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        findViewById(R.id.main_login).setOnClickListener(new View.OnClickListener()
        {
            @Override
            public void onClick(View v)
            {
                pressedLink(LinkType.Login, "");
            }
        });
        findViewById(R.id.main_logout).setOnClickListener(new View.OnClickListener()
        {
            @Override
            public void onClick(View v)
            {
                pressedLink(LinkType.Logout, "");
            }
        });
    }


    /**
     * State handling
     */

    @Override
    protected void onResume()
    {
        super.onResume();
        refresh();
    }


    /**
     * Data handling
     */

    private void refresh()
    {
        if (Api.currentUser() != null)
        {
            findViewById(R.id.main_login).setVisibility(View.GONE);
            findViewById(R.id.main_logout).setVisibility(View.VISIBLE);
            ((TextView)findViewById(R.id.main_user_info)).setText(getString(R.string.user_logged_in, Api.currentUser().getUsername()));
        }
        else
        {
            findViewById(R.id.main_login).setVisibility(View.VISIBLE);
            findViewById(R.id.main_logout).setVisibility(View.GONE);
            ((TextView)findViewById(R.id.main_user_info)).setText(R.string.user_not_logged_in);
        }
        waitRefreshCalls = 2;
        findViewById(R.id.main_spinner).setVisibility(View.VISIBLE);
        Api.product().products().enqueue(new Callback<List<Product>>()
        {
            @Override
            public void onResponse(Call<List<Product>> call, Response<List<Product>> response)
            {
                showMessageOn(R.id.main_products_message, getString(response.body().size() > 0 ? R.string.products_list : R.string.products_empty));
                fillProductsList(response.body());
                reduceCallCounter();
            }

            @Override
            public void onFailure(Call<List<Product>> call, Throwable t)
            {
                displayErrorOn(R.id.main_products_message, t);
                fillProductsList(null);
                reduceCallCounter();
            }
        });
        Api.service().services().enqueue(new Callback<List<Service>>()
        {
            @Override
            public void onResponse(Call<List<Service>> call, Response<List<Service>> response)
            {
                showMessageOn(R.id.main_services_message, getString(response.body().size() > 0 ? R.string.services_list : R.string.services_empty));
                fillServicesList(response.body());
                reduceCallCounter();
            }

            @Override
            public void onFailure(Call<List<Service>> call, Throwable t)
            {
                displayErrorOn(R.id.main_services_message, t);
                fillServicesList(null);
                reduceCallCounter();
            }
        });
    }

    private void reduceCallCounter()
    {
        if (!isFinishing())
        {
            if (waitRefreshCalls > 0)
            {
                waitRefreshCalls--;
            }
            findViewById(R.id.main_spinner).setVisibility(waitRefreshCalls > 0 ? View.VISIBLE : View.GONE);
        }
    }


    /**
     * Content handling
     */

    private void displayErrorOn(int resourceId, Throwable t)
    {
        String errorMessage = null;
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
        ((TextView)findViewById(resourceId)).setTextColor(Color.RED);
        ((TextView)findViewById(resourceId)).setText(errorMessage);
    }

    private void showMessageOn(int resourceId, String message)
    {
        ((TextView)findViewById(resourceId)).setTextColor(Color.DKGRAY);
        ((TextView)findViewById(resourceId)).setText(message);
    }

    private void fillProductsList(List<Product> products)
    {
        ((ViewGroup)findViewById(R.id.main_products_list)).removeAllViews();
        if (products != null && products.size() > 0)
        {
            boolean firstAdded = true;
            for (final Product product : products)
            {
                TextView textView = new TextView(this);
                textView.setText("> " + product.getName());
                textView.setTextColor(getResources().getColor(R.color.link));
                if (!firstAdded)
                {
                    textView.setPadding(0, getResources().getDimensionPixelSize(R.dimen.link_spacing), 0, 0);
                }
                ((ViewGroup)findViewById(R.id.main_products_list)).addView(textView);
                textView.setOnClickListener(new View.OnClickListener()
                {
                    @Override
                    public void onClick(View v)
                    {
                        pressedLink(LinkType.Product, product.getId());
                    }
                });
                firstAdded = false;
            }
            findViewById(R.id.main_products_list).setVisibility(View.VISIBLE);
        }
        else
        {
            findViewById(R.id.main_products_list).setVisibility(View.GONE);
        }
    }

    private void fillServicesList(List<Service> services)
    {
        ((ViewGroup)findViewById(R.id.main_services_list)).removeAllViews();
        if (services != null && services.size() > 0)
        {
            boolean firstAdded = true;
            for (final Service service : services)
            {
                TextView textView = new TextView(this);
                textView.setText("> " + service.getName());
                textView.setTextColor(getResources().getColor(R.color.link));
                if (!firstAdded)
                {
                    textView.setPadding(0, getResources().getDimensionPixelSize(R.dimen.link_spacing), 0, 0);
                }
                ((ViewGroup)findViewById(R.id.main_services_list)).addView(textView);
                textView.setOnClickListener(new View.OnClickListener()
                {
                    @Override
                    public void onClick(View v)
                    {
                        pressedLink(LinkType.Service, service.getId());
                    }
                });
                firstAdded = false;
            }
            findViewById(R.id.main_services_list).setVisibility(View.VISIBLE);
        }
        else
        {
            findViewById(R.id.main_services_list).setVisibility(View.GONE);
        }
    }


    /**
     * Link handling
     */

    private void pressedLink(LinkType type, String id)
    {
        Intent intent;
        switch (type)
        {
            case Login:
                intent = new Intent(this, LoginActivity.class);
                startActivity(intent);
                break;
            case Logout:
                Api.authentication().logout();
                Api.setCurrentUser(null);
                refresh();
                break;
            case Product:
                intent = new Intent(this, ProductActivity.class);
                intent.putExtras(ProductActivity.bundleForNew(id));
                startActivity(intent);
                break;
            case Service:
                intent = new Intent(this, ServiceActivity.class);
                intent.putExtras(ServiceActivity.bundleForNew(id));
                startActivity(intent);
                break;
        }
    }


    /**
     * Link type enum
     */

    private enum LinkType
    {
        Login,
        Logout,
        Product,
        Service
    }
}
