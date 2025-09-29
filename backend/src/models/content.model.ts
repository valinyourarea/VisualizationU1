import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
  content_id: string;
  title: string;
  genre: string[];
  duration_minutes: number;
  release_year: number;
  rating: number;
  views_count: number;
  production_budget: number;
  created_at?: Date;
  updated_at?: Date;
}

const ContentSchema: Schema = new Schema({
  content_id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  genre: [{ 
    type: String 
  }],
  duration_minutes: { 
    type: Number, 
    required: true 
  },
  release_year: { 
    type: Number, 
    required: true,
    index: true 
  },
  rating: { 
    type: Number, 
    min: 0, 
    max: 5 
  },
  views_count: { 
    type: Number, 
    default: 0 
  },
  production_budget: { 
    type: Number 
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  collection: 'movies'
});

// Índices compuestos para búsquedas comunes
ContentSchema.index({ genre: 1, release_year: -1 });
ContentSchema.index({ rating: -1, views_count: -1 });

export default mongoose.model<IContent>('Content', ContentSchema);