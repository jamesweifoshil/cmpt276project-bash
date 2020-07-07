function Signup() {

    var username = document.getElementById("username");
    var pass = document.getElementById("password");
    var pass_confirmation = document.getElementById("Cpassword");
    var email = document.getElementById("email");

  if(username.value == "" && pass.value  == "" && pass_confirmation.value == "" && email.value == ""){

        alert("Enter your Username, Password, confirm your password and email");

    } else if(username.value == "" && pass.value  == "" && pass_confirmation.value == ""){

        alert("Enter your Username, Password and confirm your password");

    } else if(username.value == "" && pass.value  == ""&& email.value == ""){

        alert("Enter your Username, Password and email");

    } else if(username.value == "" && pass_confirmation.value  == ""&& email.value == ""){

        alert("Enter your Username, confirm your Password and email");

    } else if(email.value == "" && pass_confirmation.value  == ""&& pass.value == "") {

        alert("Enter your email, Password and confirm your password ");

    } else if(username.value == "" && pass.value  == ""){

        alert("Enter your Username and Password");

    }else if(username.value == "" && pass_confirmation.value  == ""){

        alert("Enter your Username and confirm your Password");

    }else if(username.value == "" && email.value  == ""){

        alert("Enter your Username and email");

    }else if(pass.value == "" && email.value  == ""){

        alert("Enter your password and email");

    }else if(pass.value == "" && pass_confirmation.value  == ""){

        alert("Enter your password and Confirm your password");

    }else if(email.value == "" && pass_confirmation.value  == ""){

          alert("Enter your email and Confirm your password");

    }else if (username.value == "") {

        alert("Enter Username");

    }else if (pass.value  == "") {

        alert("Enter Password");

    }else if (pass_confirmation.value == ""){

        alert("confirm your password");

    }else if (email.value == ""){

          alert("Enter your email");

    }else if(username.value == "admin" && pass.value == "123456"){

        window.location.href="welcome.html";

    }
  }
