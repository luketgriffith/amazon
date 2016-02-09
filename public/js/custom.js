$(function(){

  $('#search').keyup(function(){

    var search_term = $(this).val();

    $.ajax({
      method: 'POST',
      url: '/api/search',
      data: {
        search_term
      },
      dataType: 'json',
      success: function(json){
        var data = json.hits.hits.map(function(hit) {
        return hit;
      });

        $('#searchResults').empty();
        for(var i=0; i< data.length; i++){
          var html='';
          html+='<div class="col-md-4">';
          html+='<a href="/product/' + <%= products[i]._id %> + '">';
          html+='<div class="thumbnail">';
          html+='<img src="'+ <%= products[i].image %>+'">';
          html+='<div class="caption">';
          html+='<h3>'<%= products[i].name %>'</h3>';
          html+='<p>'<%= products[i].category.name %>'</p>';
          html+='<p>'<%= products[i].price %>'</p>';
          html+= '</div></div></a></div>'
      
          $('#searchResults').append(html);
          
        }

      },
      error: function(error){
        console.log(error)
      }
    });




  });




});
          
            
            
            
         
        
       
    







