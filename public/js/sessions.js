var sessions = sessions || {};

/**
 * Returns the value of a url parameter, given the name of the parameter.
 * 
 * Examples:
 *   getUrlParameter("http://example.com/?f=foobar.csv", "f") => "foobar.csv"
 *
 * From http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter.
 */
sessions.getUrlParameter = function(url, paramName) {
  qs = url.split("+").join(" ");

  var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;

  while (tokens = re.exec(qs)) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }

  return params[paramName];
}

/**
 * Plots a bar visualization of a YouTube session.
 *
 * @param {array of objects} watches An array where each element is an object
 *   containing information about a YouTube watch (e.g., the feature tag for
 *   the watch, a video id, the video length, how much of the video was
 *   watched, etc.).
 * @param {object} config A container for parameters of the visualization.
 *   - where: a CSS selector for where the visualization will be inserted.
 *   - featureTagColors: a d3 color scale for mapping feature tags to colors.
 */
function plotSession(watches, config) {
/**********
 * Setup. *
 **********/
	var defaultConfig = {
		// Start the visualization x- and y-shifted by this amount from the SVG.
		// TODO: switch to translate method? 
		xShift: 25,
		yShift: 25,
		
		// The height of each video watch.
		height: 15,
		
		// How long, in pixels, a second of video takes up.		
		secondWidth: 0.5,
		
		// Gutter between video watches.
		yGutter: 5,
		
		// Where the visualization gets inserted.
		where: "",
		
		// Scale mapping feature tags to colors.
		featureTagColors: d3.scale.category20()
	};
	config = _.extend(defaultConfig, config);
	
	// Sort the watches by time watched, and assign each watch an index, so that
	// we know the y-position where the watch should be plotted.
	watches = _.sortBy(watches, function(w) { return w.startTime; });
	var index = 0;
	_.each(watches, function(w) {
		w.index = index;
		index++;
	});

	var minTime = _.min(_.map(watches, function(r) { return r.startTime; }));

/************************************
 * Create the static visualization. *
 ************************************/
	var svg = 
		d3.select(config.where)
			.append("svg")
			.attr("width", 5000)
			.attr("height", (config.height + config.yGutter) * watches.length + 50);
	
	// The rectangles showing the amount of each video that was watched.
	var rectsWatched = 
		svg.selectAll(config.where + " rect.watched")
			 .data(watches)
			 .enter()
			 .append("rect")
			 .attr("class", "watched");
	
	// The rectangles showing the amount of each video tha was unwatched.
	var rectsUnwatched = 
		svg.selectAll(config.where + " rect.unwatched")
			 .data(watches)
			 .enter()
			 .append("rect")
			 .attr("class", "unwatched");
	
	rectsWatched
		.attr("x", function(d) { 
			return config.xShift + config.secondWidth * (d.startTime - minTime);
		})
		.attr("y", function(d) { 
			return d.index * (config.height + config.yGutter);
		})
		.attr("height", config.height)
		.attr("width", function(d) { return config.secondWidth * d.watchTime; })
		.style("fill", function(d) { 
			return config.featureTagColors(d.featureTag);
		});
		
	rectsUnwatched
		.attr("x", function(d) { 
			return config.xShift + 
				config.secondWidth * (d.startTime + d.watchTime - minTime);
		})
		.attr("y", function(d) { 
			return d.index * (config.height + 5);
		})
		.attr("height", config.height)
		.attr("width", function(d) { 
			return Math.max(0, config.secondWidth * (d.videoLength - d.watchTime));
		});

/********************
 * Add interaction. *
 ********************/
  // Append an element to hold detail about each watch, which will get filled
  // in upon mouseover.
	$(config.where).append("<p class='detail'></p>")					
	
	// When mousing over a video watch, display information about that watch.
	// TODO: put this stringification of the video into a Watch object.
	svg.selectAll(config.where + " rect").on("mouseover", function(d) {
		var descr = "<b>" + d.title + "</b> by <b>" + d.username + "</b><br/>" + 
			d3.time.format("%I:%M%p")(d.date) + "<br />" +
			d.featureTag + "<br />" +
			d.device + "<br />" +
			d.category;
			
		$(config.where + " p.detail").html(descr);
	});
};