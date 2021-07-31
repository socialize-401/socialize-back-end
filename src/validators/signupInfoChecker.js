module.exports=(req,res,next)=>{
    if(!req.body.email||!req.body.pass){
        next('missing email or password');
    }else if(!req.body.firstName||!req.body.lastName){
        next('missing first or last name');
    }else{
        console.log('checker');
        next();
    }
}