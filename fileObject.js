export const File = {
	name: "File",
	// embedded: true,
	// primaryKey: "fileId",
	// properties: {
	// 	fileId: "string",
	primaryKey: "_id",
	properties: {
		_id: "objectId",
		_partition: "string",
		fileId: "string?",
		description: "string?",
		url: "string",
		type: "string",
		text: "string",
		thumbnail: "string?",
		updatedAt: "date?",
		createdAt: "date?",
		displayThumbnail: { type: "bool", default: false } // Added this line
		// isDeleted: { type: "bool", default: false }
	}
};
