function Signup() {

    var username = document.getElementById("username");
    var pass = document.getElementById("password");
    var pass_conformation = document.getElementById("Cpassword");

  if(username.value == "" && pass.value  == ""){

        alert("Enter Username and Password");

    } else if (username.value == "") {

        alert("Enter Username");

    } else if (pass.value  == "") {

        alert("Enter Password");

    } else if(username.value == "admin" && pass.value == "123456"){

        window.location.href="welcome.html";

    } 
    else if(pass!=pass_conformation)
    {
        
        alert("password did not match");
    }
}
