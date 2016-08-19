package com.crescentflare.smartmockexample;

import android.content.Context;
import android.os.Bundle;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.view.MenuItem;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;

import com.crescentflare.smartmockexample.data.ApiError;
import com.crescentflare.smartmockexample.data.User;
import com.crescentflare.smartmockexample.network.Api;
import com.crescentflare.smartmockexample.network.ApiException;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * The login activity can log in the user, when successful, it closes
 */
public class LoginActivity extends AppCompatActivity
{
    /**
     * Initialization
     */

    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        ActionBar actionBar = getSupportActionBar();
        if (actionBar != null)
        {
            actionBar.setDisplayHomeAsUpEnabled(true);
            actionBar.setHomeButtonEnabled(true);
        }
        setTitle(getString(R.string.title_login));
        findViewById(R.id.login_button).setOnClickListener(new View.OnClickListener()
        {
            @Override
            public void onClick(View v)
            {
                startLogin();
            }
        });
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
     * Authentication handling
     */

    private void startLogin()
    {
        View currentFocus = getCurrentFocus();
        if (currentFocus != null)
        {
            InputMethodManager imm = (InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.hideSoftInputFromWindow(currentFocus.getWindowToken(), 0);
        }
        String username = ((EditText)findViewById(R.id.login_username)).getText().toString().trim();
        String password = ((EditText)findViewById(R.id.login_password)).getText().toString().trim();
        findViewById(R.id.login_focus_spoofer).requestFocus();
        findViewById(R.id.login_spinner).setVisibility(View.VISIBLE);
        Api.authentication().login(username, password).enqueue(new Callback<User>()
        {
            @Override
            public void onResponse(Call<User> call, Response<User> response)
            {
                if (!isFinishing())
                {
                    Api.setCurrentUser(response.body());
                    finish();
                }
            }

            @Override
            public void onFailure(Call<User> call, Throwable t)
            {
                if (!isFinishing())
                {
                    String errorMessage = null;
                    findViewById(R.id.login_spinner).setVisibility(View.GONE);
                    ((EditText)findViewById(R.id.login_password)).setText("");
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
                    AlertDialog.Builder alert = new AlertDialog.Builder(LoginActivity.this)
                            .setTitle(getString(R.string.error_login_title))
                            .setMessage(errorMessage)
                            .setCancelable(true)
                            .setPositiveButton(getString(R.string.action_ok), null);
                    alert.show();
                }
            }
        });
    }
}
