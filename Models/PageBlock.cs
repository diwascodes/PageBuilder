namespace WebsiteBuilder.Models
{
    public class PageBlock
    {
        public int Id { get; set; }
        public int PageId { get; set; }
        public string BlockType { get; set; } // "hero", "navbar", "gridimgtext", etc.
        public int ComponentOrder { get; set; } // Sort order on page
        public string DataJson { get; set; } // JSON blob of all block data
        public Page Page { get; set; }
    }
}
