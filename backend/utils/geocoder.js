const NodeGeocoder = require("node-geocoder");

const options = {
	provider: "mapquest",
	httpAdapter: "https",
	apiKey: "kRmOaCpEZIvtQZDfQGQW5peSOglnC9pO",
	formatter: null,
};

const geocoder = NodeGeocoder(options);

async function geocode(address) {
	try {
		const res = await geocoder.geocode(address);
		return res;
	} catch (error) {
		console.error("Error geocoding address:", error);
		throw error;
	}
}

module.exports = {
	geocode,
};
